import assert from 'node:assert/strict'
import { after, before, test, mock } from 'node:test'
import { randomUUID } from 'node:crypto'
import express from 'express'
import jwt from 'jsonwebtoken'

process.env.NODE_ENV = 'production'
process.env.FRONTEND_URL = 'https://finsight-ai-exai.onrender.com'
process.env.JWT_SECRET = 'test-only-secret-never-used-in-production'
const origin = process.env.FRONTEND_URL
const users = new Map()
let databaseUnavailable = false
// In-memory database boundary only; exercise real routes, middleware, hashing and JWTs.
mock.module('../src/config/prisma.js', {
  namedExports: { prisma: { user: {
    async findUnique({ where, select }) {
      if (databaseUnavailable) throw new Error('Test database unavailable')
      const user = [...users.values()].find((u) => where.id ? u.id === where.id : u.email === where.email)
      if (!user) return null
      return select ? Object.fromEntries(Object.keys(select).map((key) => [key, user[key]])) : user
    },
    async create({ data, select }) {
      const user = { ...data, id: randomUUID(), createdAt: new Date().toISOString() }
      users.set(user.id, user)
      return Object.fromEntries(Object.keys(select).map((key) => [key, user[key]]))
    },
  } } },
})
// Unrelated financial routes are outside this auth suite.
mock.module('../src/routes/analytic.route.js', { defaultExport: express.Router() })
mock.module('../src/routes/budget.route.js', { defaultExport: express.Router() })
const { default: app } = await import('../src/app.js')
const { validateJwtConfiguration } = await import('../utils/tokens.js')
let server, base
before(async () => {
  server = app.listen(0, '127.0.0.1')
  await new Promise((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })
  base = `http://127.0.0.1:${server.address().port}/api/auth`
})
after(() => new Promise((resolve) => server.close(resolve)))
const request = (path, options = {}) => fetch(`${base}${path}`, {
  ...options, headers: { Origin: origin, ...options.headers },
})
const post = (path, body) => request(path, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})
let cookie, userId

test('logged-out session probe is 401 with exact credentialed CORS and no-store', async () => {
  assert.equal(app.get('trust proxy'), 1)
  const res = await request('/me')
  assert.equal(res.status, 401)
  assert.equal(res.headers.get('access-control-allow-origin'), origin)
  assert.equal(res.headers.get('access-control-allow-credentials'), 'true')
  assert.equal(res.headers.get('cache-control'), 'no-store')
})

test('registration hashes password, sets secure host-only cookie and persists session', async () => {
  const res = await post('/register', { userName: 'Test User', userEmail: 'user@example.test', userPassword: 'test-password' })
  assert.equal(res.status, 201)
  const payload = await res.json()
  userId = payload.user.id
  assert.equal(payload.user.password, undefined)
  assert.equal(payload.token, undefined)
  assert.notEqual(users.get(userId).password, 'test-password')
  const setCookie = res.headers.get('set-cookie')
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=None', 'Path=/', 'Max-Age=604800']) assert.ok(setCookie.includes(flag))
  assert.ok(!setCookie.includes('Domain='))
  cookie = setCookie.split(';')[0]
  const me = await request('/me', { headers: { Cookie: cookie } })
  assert.equal(me.status, 200)
  assert.equal((await me.json()).user.id, userId)
})

test('login issues a cookie that authenticates a subsequent request', async () => {
  const res = await post('/login', { userEmail: 'user@example.test', userPassword: 'test-password' })
  assert.equal(res.status, 200)
  cookie = res.headers.get('set-cookie').split(';')[0]
  const me = await request('/me', { headers: { Cookie: cookie } })
  assert.equal(me.status, 200)
  assert.equal((await me.json()).user.id, userId)
})

test('incorrect password and unknown account cannot create a session', async () => {
  for (const email of ['user@example.test', 'missing@example.test']) {
    const res = await post('/login', { userEmail: email, userPassword: 'wrong-password' })
    assert.equal(res.status, 401)
    assert.equal(res.headers.get('set-cookie'), null)
  }
})

test('expired, malformed, wrong-signature and missing-subject tokens are 401 and cleared', async () => {
  const tokens = [
    jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: -1 }),
    'not-a-jwt',
    jwt.sign({ userId }, 'another-test-only-secret'),
    jwt.sign({ userEmail: 'user@example.test' }, process.env.JWT_SECRET),
    jwt.sign({ userId }, process.env.JWT_SECRET, { algorithm: 'HS384' }),
  ]
  for (const token of tokens) {
    const res = await request('/me', { headers: { Cookie: `token=${token}` } })
    assert.equal(res.status, 401)
    assert.match(res.headers.get('set-cookie'), /token=;/)
  }
})

test('bearer header alone cannot authenticate a cookie-based session', async () => {
  const res = await request('/me', { headers: { Authorization: `Bearer ${cookie.slice(6)}` } })
  assert.equal(res.status, 401)
})

test('database errors remain 500, not unauthenticated 401', async () => {
  databaseUnavailable = true
  try {
    const res = await request('/me', { headers: { Cookie: cookie } })
    assert.equal(res.status, 500)
    assert.equal((await res.json()).message, 'Internal server error')
  } finally { databaseUnavailable = false }
})

test('missing JWT configuration fails validation and is not treated as an invalid token', async () => {
  const secret = process.env.JWT_SECRET
  delete process.env.JWT_SECRET
  try {
    assert.throws(validateJwtConfiguration, /JWT_SECRET/)
    const res = await request('/me', { headers: { Cookie: cookie } })
    assert.equal(res.status, 500)
  } finally { process.env.JWT_SECRET = secret }
})

test('CORS preflight allows deployed frontend, denies an unrelated origin', async () => {
  const preflight = await request('/login', { method: 'OPTIONS', headers: {
    'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type',
  } })
  assert.equal(preflight.status, 204)
  assert.equal(preflight.headers.get('access-control-allow-origin'), origin)
  const denied = await request('/login', { method: 'POST', headers: { Origin: 'https://attacker.example' } })
  assert.equal(denied.status, 403)
  assert.equal(denied.headers.get('access-control-allow-origin'), null)
})

test('deleted user is unauthenticated even with a signed token', async () => {
  users.delete(userId)
  const res = await request('/me', { headers: { Cookie: cookie } })
  assert.equal(res.status, 401)
})

test('logout clears cookie with the same production attributes', async () => {
  const res = await post('/logout', {})
  assert.equal(res.status, 200)
  const cleared = res.headers.get('set-cookie')
  for (const flag of ['token=;', 'HttpOnly', 'Secure', 'SameSite=None', 'Path=/']) assert.ok(cleared.includes(flag))
  assert.match(cleared, /Expires=Thu, 01 Jan 1970/)
})
