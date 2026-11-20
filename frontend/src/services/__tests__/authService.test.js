import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from '../apiClient'
import { getCurrentUser, login, register } from '../authService'

const user = { id: 'user-id', name: 'Test User' }
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json' },
})
afterEach(() => vi.unstubAllGlobals())

describe('cookie session requests', () => {
  it('includes credentials and preserves logged-out 401 for the caller', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ message: 'Authentication required' }, 401))
    vi.stubGlobal('fetch', fetchMock)
    await expect(getCurrentUser()).rejects.toMatchObject({ status: 401 })
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/api\/auth\/me$/), expect.objectContaining({ credentials: 'include' }))
  })

  for (const [name, action, details] of [
    ['login', login, { email: 'user@example.test', password: 'password' }],
    ['registration', register, { name: 'Test User', email: 'user@example.test', password: 'password' }],
  ]) {
    it(`${name} confirms cookie persistence before returning an authenticated user`, async () => {
      const fetchMock = vi.fn()
        .mockResolvedValueOnce(json({ success: true, user }))
        .mockResolvedValueOnce(json({ success: true, user }))
      vi.stubGlobal('fetch', fetchMock)
      await expect(action(details)).resolves.toMatchObject({ user })
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(fetchMock.mock.calls[1][0]).toMatch(/\/auth\/me$/)
      for (const [, options] of fetchMock.mock.calls) expect(options.credentials).toBe('include')
    })
    it(`${name} surfaces blocked or missing session cookies without reporting success`, async () => {
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce(json({ success: true, user }))
        .mockResolvedValueOnce(json({ message: 'Authentication required' }, 401)))
      await expect(action(details)).rejects.toMatchObject({ status: 401, message: expect.stringContaining('session cookie') })
    })
  }

  it('does not mislabel network failures as an unauthenticated session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network error')))
    await expect(apiRequest('/auth/me')).rejects.toMatchObject({ status: 0 })
  })
})
