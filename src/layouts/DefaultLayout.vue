<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'

const auth = useAuthStore()
const cart = useCartStore()
const mobileMenuOpen = ref(false)

async function handleLogout() {
  await auth.logout()
  mobileMenuOpen.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 justify-between">
          <div class="flex items-center gap-8">
            <RouterLink to="/" class="text-xl font-bold text-indigo-600">SIT Marketplace</RouterLink>
            <div class="hidden sm:flex sm:gap-6">
              <RouterLink to="/" class="text-gray-700 hover:text-indigo-600 text-sm font-medium">Productos</RouterLink>
              <RouterLink to="/stores" class="text-gray-700 hover:text-indigo-600 text-sm font-medium">Tiendas</RouterLink>
            </div>
          </div>

          <div class="flex items-center gap-4">
            <RouterLink to="/cart" class="relative text-gray-700 hover:text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <span
                v-if="cart.totalItems > 0"
                class="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs text-white"
              >
                {{ cart.totalItems }}
              </span>
            </RouterLink>

            <template v-if="auth.isAuthenticated">
              <div class="hidden sm:flex sm:items-center sm:gap-4">
                <RouterLink v-if="auth.isSeller || auth.isAdmin" to="/my-store" class="text-sm text-gray-700 hover:text-indigo-600">Mi Tienda</RouterLink>
                <RouterLink to="/orders" class="text-sm text-gray-700 hover:text-indigo-600">Pedidos</RouterLink>
                <RouterLink to="/profile" class="text-sm text-gray-700 hover:text-indigo-600">{{ auth.user?.name }}</RouterLink>
                <button @click="handleLogout" class="text-sm text-gray-500 hover:text-red-600">Salir</button>
              </div>
            </template>
            <template v-else>
              <div class="hidden sm:flex sm:items-center sm:gap-3">
                <RouterLink to="/login" class="text-sm font-medium text-gray-700 hover:text-indigo-600">Ingresar</RouterLink>
                <RouterLink to="/register" class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">Registrarse</RouterLink>
              </div>
            </template>

            <button @click="mobileMenuOpen = !mobileMenuOpen" class="sm:hidden text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="mobileMenuOpen" class="sm:hidden border-t px-4 pb-3 pt-2 space-y-1">
        <RouterLink to="/" class="block py-2 text-gray-700" @click="mobileMenuOpen = false">Productos</RouterLink>
        <RouterLink to="/stores" class="block py-2 text-gray-700" @click="mobileMenuOpen = false">Tiendas</RouterLink>
        <template v-if="auth.isAuthenticated">
          <RouterLink v-if="auth.isSeller || auth.isAdmin" to="/my-store" class="block py-2 text-gray-700" @click="mobileMenuOpen = false">Mi Tienda</RouterLink>
          <RouterLink to="/orders" class="block py-2 text-gray-700" @click="mobileMenuOpen = false">Pedidos</RouterLink>
          <RouterLink to="/profile" class="block py-2 text-gray-700" @click="mobileMenuOpen = false">Perfil</RouterLink>
          <button @click="handleLogout" class="block w-full text-left py-2 text-red-600">Salir</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="block py-2 text-gray-700" @click="mobileMenuOpen = false">Ingresar</RouterLink>
          <RouterLink to="/register" class="block py-2 text-indigo-600 font-medium" @click="mobileMenuOpen = false">Registrarse</RouterLink>
        </template>
      </div>
    </nav>

    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <RouterView />
    </main>
  </div>
</template>
