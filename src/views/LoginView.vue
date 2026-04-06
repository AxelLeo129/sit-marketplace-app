<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref('')

async function handleSubmit() {
  error.value = ''
  try {
    await auth.login({ email: email.value, password: password.value })
    const redirect = (route.query.redirect as string) ?? '/'
    router.push(redirect)
  } catch (e: unknown) {
    const err = e as { message?: string }
    error.value = err.message ?? 'Credenciales incorrectas'
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md space-y-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900">Iniciar Sesión</h1>
        <p class="mt-2 text-gray-600">Ingresa a tu cuenta de SIT Marketplace</p>
      </div>

      <form class="space-y-6" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Correo electrónico</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          :disabled="auth.loading"
          class="w-full rounded-md bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {{ auth.loading ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>

      <p class="text-center text-sm text-gray-600">
        ¿No tienes cuenta?
        <RouterLink to="/register" class="font-medium text-indigo-600 hover:text-indigo-500">Regístrate</RouterLink>
      </p>
    </div>
  </div>
</template>
