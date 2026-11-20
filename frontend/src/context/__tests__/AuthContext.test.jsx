import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useEffect } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AuthProvider, ProtectedRoute, useAuth } from '../AuthContext'
import * as authService from '../../services/authService'

vi.mock('../../services/authService', () => ({
  getCurrentUser: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn(),
}))
let auth
function PublicPage() {
  const context = useAuth()
  useEffect(() => { auth = context }, [context])
  return <main>Public landing page<span>{context.user?.name || 'Guest'}</span></main>
}
const renderPublic = () => render(<AuthProvider><PublicPage /></AuthProvider>)
beforeEach(() => vi.resetAllMocks())
afterEach(cleanup)

for (const reason of ['logged out', 'expired session', 'invalid token']) {
  it(`keeps public content available when ${reason}`, async () => {
    authService.getCurrentUser.mockRejectedValue({ status: 401, message: reason })
    renderPublic()
    expect(screen.getByText('Public landing page')).toBeTruthy()
    await waitFor(() => expect(auth.authLoading).toBe(false))
    expect(auth.isAuthenticated).toBe(false)
    expect(screen.getByText('Guest')).toBeTruthy()
  })
}

it('restores an authenticated user', async () => {
  authService.getCurrentUser.mockResolvedValue({ user: { name: 'Test User' } })
  renderPublic()
  await screen.findByText('Test User')
  expect(auth.isAuthenticated).toBe(true)
})

it('a late startup 401 cannot overwrite a successful login', async () => {
  let rejectProbe
  authService.getCurrentUser.mockReturnValue(new Promise((_, reject) => { rejectProbe = reject }))
  authService.login.mockResolvedValue({ user: { name: 'Signed In' } })
  renderPublic()
  await act(async () => { await auth.login({}) })
  await act(async () => { rejectProbe({ status: 401 }) })
  expect(screen.getByText('Signed In')).toBeTruthy()
  expect(auth.authLoading).toBe(false)
})

it('failed login finishes loading even when a startup probe is pending', async () => {
  authService.getCurrentUser.mockReturnValue(new Promise(() => {}))
  authService.login.mockRejectedValue(new Error('Session cookie unavailable'))
  renderPublic()
  await act(async () => { await expect(auth.login({})).rejects.toThrow('Session cookie') })
  expect(auth.authLoading).toBe(false)
  expect(auth.isAuthenticated).toBe(false)
})

it('logged-out users cannot render protected dashboard content', async () => {
  authService.getCurrentUser.mockRejectedValue({ status: 401 })
  render(<MemoryRouter><AuthProvider><ProtectedRoute><div>Private dashboard</div></ProtectedRoute></AuthProvider></MemoryRouter>)
  await waitFor(() => expect(screen.queryByText('Verifying session...')).toBeNull())
  expect(screen.queryByText('Private dashboard')).toBeNull()
})
