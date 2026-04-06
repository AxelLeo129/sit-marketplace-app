<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import type { Role } from '@/types'

const auth = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const roleId = ref(3) // buyer by default
const error = ref('')
const errors = ref<Record<string, string[]>>({})
const roles = ref<Role[]>([])

async function loadRoles() {
  // Roles 2=seller, 3=buyer. Admin not available for registration.
  roles.value = [
    { id: 2, name: 'seller' },
    { id: 3, name: 'buyer' },
  ]
}
loadRoles()

async function handleSubmit() {
  error.value = ''
  errors.value = {}
  try {
    await auth.register({
      name: name.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
      role_id: roleId.value,
    })
    router.push('/')
  } catch (e: unknown) {
    const err = e as { message?: string; errors?: Record<string, string[]> }
    error.value = err.message ?? 'Error al registrarse'
    errors.value = err.errors ?? {}
  }
}

const roleLabels: Record<string, string> = {
  seller: 'Vendedor',
  buyer: 'Comprador',
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-md space-y-8">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900">Crear Cuenta</h1>
        <p class="mt-2 text-gray-600">Regístrate en SIT Marketplace</p>
      </div>

      <form class="space-y-5" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

        <div>
          <label for="name" class="block text-sm font-medium text-gray-700">Nombre completo</label>
          <input
            id="name"
            v-model="name"
            type="text"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
          />
          <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name[0] }}</p>
        </div>

        <div>
          <label for="reg-email" class="block text-sm font-medium text-gray-700">Correo electrónico</label>
          <input
            id="reg-email"
            v-model="email"
            type="email"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
          />
          <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email[0] }}</p>
        </div>

        <div>
          <label for="reg-password" class="block text-sm font-medium text-gray-700">Contraseña</label>
          <input
            id="reg-password"
            v-model="password"
            type="password"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
          />
          <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password[0] }}</p>
        </div>

        <div>
          <label for="password-confirm" class="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
          <input
            id="password-confirm"
            v-model="passwordConfirmation"
            type="password"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Tipo de cuenta</label>
          <div class="mt-2 flex gap-4">
            <label v-for="role in roles" :key="role.id" class="flex items-center gap-2">
              <input v-model="roleId" :value="role.id" type="radio" name="role" class="text-indigo-600" />
              <span class="text-sm text-gray-700">{{ roleLabels[role.name] ?? role.name }}</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          :disabled="auth.loading"
          class="w-full rounded-md bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {{ auth.loading ? 'Creando cuenta...' : 'Registrarse' }}
        </button>
      </form>

      <p class="text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?
        <RouterLink to="/login" class="font-medium text-indigo-600 hover:text-indigo-500">Inicia sesión</RouterLink>
      </p>
    </div>
  </div>
</template>
