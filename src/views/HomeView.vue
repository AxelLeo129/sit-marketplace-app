<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { api } from '@/services/api'
import type { Product, Category, PaginatedResponse } from '@/types'

const route = useRoute()
const router = useRouter()

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const search = ref((route.query.search as string) ?? '')
const categoryId = ref(route.query.category ? Number(route.query.category) : null)
const currentPage = ref(1)
const lastPage = ref(1)
const loading = ref(false)

async function loadProducts() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.set('page', String(currentPage.value))
    if (search.value) params.set('search', search.value)
    if (categoryId.value) params.set('category', String(categoryId.value))

    const res = await api.get<PaginatedResponse<Product>>(`/products?${params}`)
    products.value = res.data
    currentPage.value = res.meta.current_page
    lastPage.value = res.meta.last_page
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  const res = await api.get<{ data: Category[] }>('/categories')
  categories.value = res.data
}

function handleSearch() {
  currentPage.value = 1
  router.replace({ query: { ...route.query, search: search.value || undefined, page: undefined } })
  loadProducts()
}

function selectCategory(id: number | null) {
  categoryId.value = id
  currentPage.value = 1
  router.replace({ query: { ...route.query, category: id ?? undefined, page: undefined } })
  loadProducts()
}

function goToPage(page: number) {
  currentPage.value = page
  loadProducts()
}

loadCategories()
loadProducts()
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Productos</h1>

    <div class="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <form class="flex gap-2" @submit.prevent="handleSearch">
        <input
          v-model="search"
          type="text"
          placeholder="Buscar productos..."
          class="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
        />
        <button type="submit" class="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
          Buscar
        </button>
      </form>

      <div class="flex flex-wrap gap-2">
        <button
          :class="[
            'rounded-full px-3 py-1 text-xs font-medium',
            categoryId === null ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
          ]"
          @click="selectCategory(null)"
        >
          Todas
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          :class="[
            'rounded-full px-3 py-1 text-xs font-medium',
            categoryId === cat.id ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
          ]"
          @click="selectCategory(cat.id)"
        >
          {{ cat.name }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="mt-12 text-center text-gray-500">Cargando...</div>

    <div v-else-if="products.length === 0" class="mt-12 text-center text-gray-500">
      No se encontraron productos.
    </div>

    <div v-else class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <div v-else class="flex h-full items-center justify-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div class="p-4">
          <h3 class="text-sm font-medium text-gray-900 group-hover:text-indigo-600">{{ product.name }}</h3>
          <p v-if="product.store" class="mt-1 text-xs text-gray-500">{{ product.store.name }}</p>
          <p class="mt-2 text-lg font-bold text-indigo-600">${{ Number(product.price).toFixed(2) }}</p>
          <p v-if="product.stock === 0" class="mt-1 text-xs text-red-500">Agotado</p>
        </div>
      </RouterLink>
    </div>

    <div v-if="lastPage > 1" class="mt-8 flex justify-center gap-2">
      <button
        v-for="page in lastPage"
        :key="page"
        :class="[
          'rounded-md px-3 py-1 text-sm',
          page === currentPage ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        ]"
        @click="goToPage(page)"
      >
        {{ page }}
      </button>
    </div>
  </div>
</template>
