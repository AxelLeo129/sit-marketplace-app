<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-bold text-gray-900">Mi Perfil</h1>

    <div v-if="auth.user" class="mt-6 rounded-lg border bg-white p-6">
      <div class="flex items-center gap-6">
        <div class="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-100">
          <img v-if="auth.user.avatar_url" :src="auth.user.avatar_url" :alt="auth.user.name" class="h-full w-full object-cover" />
          <div v-else class="flex h-full items-center justify-center text-2xl font-bold text-gray-400">
            {{ auth.user.name.charAt(0) }}
          </div>
        </div>
        <div>
          <h2 class="text-xl font-semibold text-gray-900">{{ auth.user.name }}</h2>
          <p class="text-gray-600">{{ auth.user.email }}</p>
          <span class="mt-1 inline-block rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-700">
            {{ auth.user.role.name }}
          </span>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <span class="text-sm text-gray-500">Teléfono</span>
          <p class="text-gray-900">{{ auth.user.phone ?? 'No registrado' }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-500">Fecha de nacimiento</span>
          <p class="text-gray-900">{{ auth.user.birth_date ?? 'No registrada' }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-500">Miembro desde</span>
          <p class="text-gray-900">{{ new Date(auth.user.created_at).toLocaleDateString() }}</p>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap gap-3">
        <RouterLink to="/orders" class="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Mis Pedidos</RouterLink>
        <RouterLink to="/addresses" class="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Mis Direcciones</RouterLink>
        <RouterLink v-if="auth.isSeller || auth.isAdmin" to="/my-store" class="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Mi Tienda</RouterLink>
      </div>
    </div>
  </div>
</template>
