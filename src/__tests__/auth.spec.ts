import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { tokenStorage } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const doctor = { id: 1, name: 'Demo Médico', role: 'doctor', role_label: 'Médico' }

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('guarda el token y el usuario al iniciar sesión', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ user: doctor, token: 't1' }))),
    )
    const auth = useAuthStore()

    await auth.login('12345', 'password')

    expect(tokenStorage.get()).toBe('t1')
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.hasRole('doctor')).toBe(true)
    expect(auth.hasRole('admin', 'billing')).toBe(false)
  })

  it('olvida la sesión aunque falle el logout en la API', async () => {
    tokenStorage.set('t1')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const auth = useAuthStore()

    await auth.logout().catch(() => undefined)

    expect(tokenStorage.get()).toBeNull()
    expect(auth.isAuthenticated).toBe(false)
  })
})
