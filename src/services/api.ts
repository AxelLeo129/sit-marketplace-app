/**
 * Cliente HTTP de la API de SIT Marketplace.
 *
 * Agrega el token de sesión, convierte los errores en ApiError y avisa
 * cuando la sesión venció (401) para que la app regrese al login.
 */

const API_URL = import.meta.env.VITE_API_URL
const TOKEN_KEY = 'sit_token'

/** Error devuelto por la API, con los errores de validación por campo (422). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errors: Record<string, string[]> = {},
  ) {
    super(message)
  }

  /** Primer mensaje de cada campo con error, para mostrarlo bajo su input. */
  fieldErrors(): Record<string, string> {
    return Object.fromEntries(
      Object.entries(this.errors).map(([field, messages]) => [field, messages[0] ?? '']),
    )
  }
}

let onUnauthorized: (() => void) | null = null

/** Registra qué hacer cuando la API rechaza el token (sesión vencida o usuario desactivado). */
export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler
}

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
}

async function request<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = tokenStorage.get()

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // FormData (archivos) define su propio Content-Type con el boundary.
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión.', 0)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const payload: unknown = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401 && token) {
      onUnauthorized?.()
    }

    const body = payload as { message?: string; errors?: Record<string, string[]> }
    throw new ApiError(
      body.message ?? 'Ocurrió un error inesperado.',
      response.status,
      body.errors ?? {},
    )
  }

  return payload as T
}

export const api = {
  get: <T>(endpoint: string) => request<T>('GET', endpoint),
  post: <T>(endpoint: string, body?: unknown) => request<T>('POST', endpoint, body),
  put: <T>(endpoint: string, body: unknown) => request<T>('PUT', endpoint, body),
  patch: <T>(endpoint: string, body: unknown) => request<T>('PATCH', endpoint, body),
  delete: <T>(endpoint: string) => request<T>('DELETE', endpoint),
}
