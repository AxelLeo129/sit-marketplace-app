import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, tokenStorage } from '@/services/api'
import type { Resource } from '@/types/api'
import type { Role, User } from '@/types/user'

/**
 * Sesión del usuario: token, datos del usuario y sus permisos por rol.
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(tokenStorage.get())

  const isAuthenticated = computed(() => token.value !== null)

  /** Indica si el usuario tiene alguno de los roles. */
  function hasRole(...roles: Role[]): boolean {
    return user.value !== null && roles.includes(user.value.role)
  }

  /** Inicia sesión con correo o número de colegiado. */
  async function login(login: string, password: string): Promise<void> {
    const response = await api.post<{ user: User; token: string }>('/login', { login, password })

    tokenStorage.set(response.token)
    token.value = response.token
    user.value = response.user
  }

  /** Carga el usuario del token guardado (al abrir o recargar la app). */
  async function fetchUser(): Promise<void> {
    const response = await api.get<Resource<User>>('/me')
    user.value = response.data
  }

  /** Reemplaza los datos del usuario tras editar el perfil. */
  function setUser(updated: User): void {
    user.value = updated
  }

  /** Cierra la sesión en la API y olvida el token local, aunque la API falle. */
  async function logout(): Promise<void> {
    try {
      await api.post('/logout')
    } finally {
      clear()
    }
  }

  /** Olvida la sesión sin llamar a la API (p. ej. si el token ya venció). */
  function clear(): void {
    tokenStorage.clear()
    token.value = null
    user.value = null
  }

  return { user, token, isAuthenticated, hasRole, login, fetchUser, setUser, logout, clear }
})
