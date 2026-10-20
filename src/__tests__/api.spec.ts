import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, setUnauthorizedHandler, tokenStorage } from '@/services/api'

/** Simula una respuesta de fetch con JSON. */
function mockFetch(status: number, body: unknown = {}) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(status === 204 ? null : JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('api', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.unstubAllGlobals())

  it('envía el token guardado', async () => {
    tokenStorage.set('abc')
    const fetchMock = mockFetch(200, { data: [] })

    await api.get('/categories')

    const [, options] = fetchMock.mock.calls[0]!
    expect(options.headers.Authorization).toBe('Bearer abc')
  })

  it('convierte los errores de validación en ApiError con el primer mensaje por campo', async () => {
    mockFetch(422, {
      message: 'Datos inválidos.',
      errors: { email: ['Correo requerido.', 'Otro'] },
    })

    const error = await api.post('/login', {}).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(422)
    expect((error as ApiError).fieldErrors()).toEqual({ email: 'Correo requerido.' })
  })

  it('avisa cuando la API rechaza el token', async () => {
    tokenStorage.set('vencido')
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    mockFetch(401, { message: 'Unauthenticated.' })

    await api.get('/me').catch(() => undefined)

    expect(handler).toHaveBeenCalledOnce()
  })

  it('no trata el 401 del login como sesión vencida', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    mockFetch(401, { message: 'Credenciales inválidas.' })

    await api.post('/login', {}).catch(() => undefined)

    expect(handler).not.toHaveBeenCalled()
  })

  it('reporta cuando no hay conexión', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const error = await api.get('/me').catch((e: unknown) => e)

    expect((error as ApiError).status).toBe(0)
  })
})
