import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'
import type { User, LoginPayload, RegisterPayload } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role.name ?? null)
  const isSeller = computed(() => userRole.value === 'seller')
  const isAdmin = computed(() => userRole.value === 'admin')

  function setAuth(newToken: string, newUser: User) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('token', newToken)
  }

  function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  async function register(payload: RegisterPayload) {
    loading.value = true
    try {
      const res = await api.post<{ token: string; user: { data: User } }>('/register', payload)
      setAuth(res.token, res.user.data)
    } finally {
      loading.value = false
    }
  }

  async function login(payload: LoginPayload) {
    loading.value = true
    try {
      const res = await api.post<{ token: string; user: { data: User } }>('/login', payload)
      setAuth(res.token, res.user.data)
    } finally {
      loading.value = false
    }
  }

  async function fetchUser() {
    if (!token.value) return
    try {
      const res = await api.get<{ data: User }>('/me')
      user.value = res.data
    } catch {
      clearAuth()
    }
  }

  async function logout() {
    try {
      await api.post('/logout')
    } finally {
      clearAuth()
    }
  }

  return { user, token, loading, isAuthenticated, userRole, isSeller, isAdmin, register, login, fetchUser, logout }
})
