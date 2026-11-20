import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'

const root = new URL('../prisma/migrations/', import.meta.url)
const migrationNames = (await readdir(root)).filter((name) => /^\d+_/.test(name)).sort()
const migrations = await Promise.all(migrationNames.map((name) => readFile(new URL(`${name}/migration.sql`, root), 'utf8')))

test('complete migration history creates a usable UUID auth and financial schema on an empty database', async () => {
  const db = new PGlite()
  try {
    for (const sql of migrations) await db.exec(sql)
    const id = 'e951f58e-e09b-4715-9db8-377306b3964c'
    await db.query('INSERT INTO "User" (id, name, email, password, "updatedAt") VALUES ($1, $2, $3, $4, now())', [id, 'Test User', 'new@example.test', 'test-hash'])
    await db.query('INSERT INTO "Budget" (id, "userId", category, "monthlyLimit", month, year, "updatedAt") VALUES ($1, $2, $3, 100, 11, 2026, now())', ['caa5f58e-e09b-4715-9db8-377306b3964c', id, 'Food'])
    const { rows } = await db.query('SELECT id, email, "createdAt", "updatedAt" FROM "User"')
    assert.equal(rows[0].id, id)
    assert.ok(rows[0].createdAt)
    assert.ok(rows[0].updatedAt)
    await assert.rejects(db.query('INSERT INTO "User" (id, name, email, password, "updatedAt") VALUES ($1, $2, $3, $4, now())', ['b951f58e-e09b-4715-9db8-377306b3964c', 'Duplicate', 'new@example.test', 'test-hash']), /unique constraint/)
  } finally { await db.close() }
})

test('legacy users and password hashes survive the UUID bridge', async () => {
  const db = new PGlite()
  try {
    await db.exec(migrations[0])
    await db.exec(`INSERT INTO "User" (name, email, password) VALUES ('Existing User', 'existing@example.test', 'preserved-password-hash'), (NULL, 'nameless@example.test', 'another-preserved-hash')`)
    for (const sql of migrations.slice(1)) await db.exec(sql)
    const { rows } = await db.query('SELECT id, name, email, password FROM "User" ORDER BY email')
    assert.equal(rows.length, 2)
    assert.deepEqual(rows[0], { id: '00000000-0000-4000-8000-000000000001', name: 'Existing User', email: 'existing@example.test', password: 'preserved-password-hash' })
    assert.equal(rows[1].name, 'nameless@example.test')
    assert.equal(rows[1].password, 'another-preserved-hash')
  } finally { await db.close() }
})

test('duplicate legacy emails stop migration without deleting or partially converting users', async () => {
  const db = new PGlite()
  try {
    await db.exec(migrations[0])
    await db.exec(`INSERT INTO "User" (name, email, password) VALUES ('One', 'duplicate@example.test', 'one'), ('Two', 'duplicate@example.test', 'two')`)
    await assert.rejects(db.exec(migrations[1]), /unique index/)
    await db.exec('ROLLBACK')
    const { rows } = await db.query('SELECT id, password FROM "User" ORDER BY id')
    assert.deepEqual(rows, [{ id: 1, password: 'one' }, { id: 2, password: 'two' }])
  } finally { await db.close() }
})
