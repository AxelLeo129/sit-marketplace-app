<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'

const cart = useCartStore()
const auth = useAuthStore()
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Carrito</h1>

    <div v-if="cart.items.length === 0" class="mt-12 text-center">
      <p class="text-gray-500">Tu carrito está vacío.</p>
      <RouterLink to="/" class="mt-4 inline-block text-indigo-600 hover:text-indigo-500">Ver productos</RouterLink>
    </div>

    <div v-else class="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div class="lg:col-span-2 space-y-4">
        <div
          v-for="item in cart.items"
          :key="item.product.id"
          class="flex gap-4 rounded-lg border bg-white p-4"
        >
          <div class="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-gray-100">
            <img
              v-if="item.product.images.length > 0"
              :src="item.product.images[0].url"
              :alt="item.product.name"
              class="h-full w-full object-cover"
            />
          </div>
          <div class="flex flex-1 flex-col justify-between">
            <div>
              <RouterLink
                :to="{ name: 'product-detail', params: { slug: item.product.slug } }"
                class="font-medium text-gray-900 hover:text-indigo-600"
              >
                {{ item.product.name }}
              </RouterLink>
              <p class="text-sm text-gray-500">${{ Number(item.product.price).toFixed(2) }} c/u</p>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center rounded-md border">
                <button class="px-2 py-1 text-gray-600 hover:bg-gray-100" @click="cart.updateQuantity(item.product.id, item.quantity - 1)">−</button>
                <span class="px-3 py-1 text-sm">{{ item.quantity }}</span>
                <button class="px-2 py-1 text-gray-600 hover:bg-gray-100" @click="cart.updateQuantity(item.product.id, item.quantity + 1)">+</button>
              </div>
              <div class="flex items-center gap-4">
                <span class="font-medium text-gray-900">${{ (item.product.price * item.quantity).toFixed(2) }}</span>
                <button class="text-sm text-red-600 hover:text-red-500" @click="cart.removeItem(item.product.id)">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-lg border bg-white p-6">
        <h2 class="text-lg font-semibold text-gray-900">Resumen</h2>
        <div class="mt-4 space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Productos ({{ cart.totalItems }})</span>
            <span class="font-medium">${{ cart.totalPrice.toFixed(2) }}</span>
          </div>
        </div>
        <div class="mt-4 border-t pt-4 flex justify-between text-lg font-bold">
          <span>Total</span>
          <span class="text-indigo-600">${{ cart.totalPrice.toFixed(2) }}</span>
        </div>

        <RouterLink
          v-if="auth.isAuthenticated"
          to="/orders"
          class="mt-6 block w-full rounded-md bg-indigo-600 px-4 py-2 text-center text-white font-medium hover:bg-indigo-700"
        >
          Proceder al pago
        </RouterLink>
        <RouterLink
          v-else
          to="/login?redirect=/cart"
          class="mt-6 block w-full rounded-md bg-indigo-600 px-4 py-2 text-center text-white font-medium hover:bg-indigo-700"
        >
          Inicia sesión para comprar
        </RouterLink>

        <button
          class="mt-3 w-full text-sm text-red-600 hover:text-red-500"
          @click="cart.clear()"
        >
          Vaciar carrito
        </button>
      </div>
    </div>
  </div>
</template>
