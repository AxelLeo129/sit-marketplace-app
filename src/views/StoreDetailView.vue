<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/services/api'
import type { Store, Product, PaginatedResponse } from '@/types'

const props = defineProps<{ slug: string }>()

const store = ref<Store | null>(null)
const products = ref<Product[]>([])
const currentPage = ref(1)
const lastPage = ref(1)
const loading = ref(true)

async function loadStore() {
  const res = await api.get<{ data: Store }>(`/stores/${props.slug}`)
  store.value = res.data
}

async function loadProducts(page = 1) {
  const res = await api.get<PaginatedResponse<Product>>(`/products?store=${store.value?.id}&page=${page}`)
  products.value = res.data
  currentPage.value = res.meta.current_page
  lastPage.value = res.meta.last_page
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
  <div v-if="loading" class="text-center text-gray-500 py-12">Cargando...</div>

  <div v-else-if="!store" class="text-center py-12">
    <p class="text-gray-500">Tienda no encontrada.</p>
    <RouterLink to="/stores" class="mt-4 inline-block text-indigo-600">Ver tiendas</RouterLink>
  </div>

  <div v-else>
    <div class="flex items-center gap-6">
      <div class="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-100">
        <img v-if="store.logo_url" :src="store.logo_url" :alt="store.name" class="h-full w-full object-cover" />
        <div v-else class="flex h-full items-center justify-center text-2xl font-bold text-gray-400">
          {{ store.name.charAt(0) }}
        </div>
      </div>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ store.name }}</h1>
        <p v-if="store.description" class="mt-1 text-gray-600">{{ store.description }}</p>
        <p v-if="store.phone" class="mt-1 text-sm text-gray-500">Tel: {{ store.phone }}</p>
      </div>
    </div>

    <h2 class="mt-10 text-xl font-semibold text-gray-900">Productos</h2>

    <div v-if="products.length === 0" class="mt-6 text-gray-500">Esta tienda aún no tiene productos.</div>

    <div v-else class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <RouterLink
        v-for="product in products"
        :key="product.id"
        :to="{ name: 'product-detail', params: { slug: product.slug } }"
        class="group overflow-hidden rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="aspect-square bg-gray-100">
          <img
            v-if="product.images.length > 0"
            :src="product.images[0].url"
            :alt="product.name"
            class="h-full w-full object-cover"
          />
        </div>
        <div class="p-4">
          <h3 class="text-sm font-medium text-gray-900 group-hover:text-indigo-600">{{ product.name }}</h3>
          <p class="mt-2 text-lg font-bold text-indigo-600">${{ Number(product.price).toFixed(2) }}</p>
        </div>
      </RouterLink>
    </div>

    <div v-if="lastPage > 1" class="mt-8 flex justify-center gap-2">
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
</template>
