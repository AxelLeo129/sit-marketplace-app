<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { Product, Store, PaginatedResponse } from '@/types'

const auth = useAuthStore()
const products = ref<Product[]>([])
const store = ref<Store | null>(null)
const loading = ref(true)
const currentPage = ref(1)
const lastPage = ref(1)

async function loadStore() {
  const res = await api.get<{ data: Store[] }>(`/stores?user=${auth.user?.id}`)
  store.value = res.data.length > 0 ? res.data[0] : null
}

async function loadProducts(page = 1) {
  if (!store.value) return
  const res = await api.get<PaginatedResponse<Product>>(`/products?store=${store.value.id}&page=${page}`)
  products.value = res.data
  currentPage.value = res.meta.current_page
  lastPage.value = res.meta.last_page
}

async function deleteProduct(id: number) {
  if (!confirm('¿Eliminar este producto?')) return
  await api.delete(`/products/${id}`)
  await loadProducts(currentPage.value)
}

async function init() {
  loading.value = true
  try {
    await loadStore()
    await loadProducts()
  } finally {
    loading.value = false
  }
}

init()
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Mis Productos</h1>
      <RouterLink
        v-if="store"
        to="/my-products/new"
        class="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
      >
        Nuevo producto
      </RouterLink>
    </div>

    <div v-if="loading" class="mt-8 text-center text-gray-500">Cargando...</div>

    <div v-else-if="!store" class="mt-12 text-center">
      <p class="text-gray-500">Primero debes crear tu tienda.</p>
      <RouterLink to="/my-store" class="mt-4 inline-block text-indigo-600">Crear tienda</RouterLink>
    </div>

    <div v-else-if="products.length === 0" class="mt-12 text-center text-gray-500">
      No tienes productos aún.
    </div>

    <div v-else class="mt-6">
      <div class="overflow-x-auto rounded-lg border">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="product in products" :key="product.id">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 shrink-0 overflow-hidden rounded bg-gray-100">
                    <img v-if="product.images.length > 0" :src="product.images[0].url" class="h-full w-full object-cover" />
                  </div>
                  <span class="text-sm font-medium text-gray-900">{{ product.name }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">${{ Number(product.price).toFixed(2) }}</td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ product.stock }}</td>
              <td class="px-4 py-3">
                <span :class="[product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600', 'rounded-full px-2 py-1 text-xs font-medium']">
                  {{ product.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-2">
                  <RouterLink :to="`/my-products/${product.id}/edit`" class="text-sm text-indigo-600 hover:text-indigo-500">Editar</RouterLink>
                  <button class="text-sm text-red-600 hover:text-red-500" @click="deleteProduct(product.id)">Eliminar</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="lastPage > 1" class="mt-6 flex justify-center gap-2">
        <button
          v-for="page in lastPage"
          :key="page"
          :class="['rounded-md px-3 py-1 text-sm', page === currentPage ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300']"
          @click="loadProducts(page)"
        >
          {{ page }}
        </button>
      </div>
    </div>
  </div>
</template>
