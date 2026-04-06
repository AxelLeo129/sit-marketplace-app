<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/services/api'
import type { Store, PaginatedResponse } from '@/types'

const stores = ref<Store[]>([])
const currentPage = ref(1)
const lastPage = ref(1)
const loading = ref(false)

async function loadStores(page = 1) {
  loading.value = true
  try {
    const res = await api.get<PaginatedResponse<Store>>(`/stores?page=${page}`)
    stores.value = res.data
    currentPage.value = res.meta.current_page
    lastPage.value = res.meta.last_page
  } finally {
    loading.value = false
  }
}

loadStores()
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Tiendas</h1>

    <div v-if="loading" class="mt-12 text-center text-gray-500">Cargando...</div>

    <div v-else-if="stores.length === 0" class="mt-12 text-center text-gray-500">No hay tiendas disponibles.</div>

    <div v-else class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="store in stores"
        :key="store.id"
        :to="{ name: 'store-detail', params: { slug: store.slug } }"
        class="flex items-center gap-4 rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100">
          <img v-if="store.logo_url" :src="store.logo_url" :alt="store.name" class="h-full w-full object-cover" />
          <div v-else class="flex h-full items-center justify-center text-xl font-bold text-gray-400">
            {{ store.name.charAt(0) }}
          </div>
        </div>
        <div>
          <h3 class="font-medium text-gray-900">{{ store.name }}</h3>
          <p v-if="store.description" class="mt-1 text-sm text-gray-500 line-clamp-2">{{ store.description }}</p>
          <p v-if="store.products_count !== undefined" class="mt-1 text-xs text-gray-400">
            {{ store.products_count }} producto{{ store.products_count === 1 ? '' : 's' }}
          </p>
        </div>
      </RouterLink>
    </div>

    <div v-if="lastPage > 1" class="mt-8 flex justify-center gap-2">
      <button
        v-for="page in lastPage"
        :key="page"
        :class="['rounded-md px-3 py-1 text-sm', page === currentPage ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300']"
        @click="loadStores(page)"
      >
        {{ page }}
      </button>
    </div>
  </div>
</template>
