<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { api } from '@/services/api'
import { useCartStore } from '@/stores/cart'
import type { Product } from '@/types'

const props = defineProps<{ slug: string }>()
const route = useRoute()
const cart = useCartStore()

const product = ref<Product | null>(null)
const quantity = ref(1)
const loading = ref(true)
const selectedImage = ref(0)
const added = ref(false)

async function loadProduct() {
  loading.value = true
  try {
    const res = await api.get<{ data: Product }>(`/products/${props.slug}`)
    product.value = res.data
  } finally {
    loading.value = false
  }
}

function addToCart() {
  if (!product.value) return
  cart.addItem(product.value, quantity.value)
  added.value = true
  setTimeout(() => (added.value = false), 2000)
}

loadProduct()
</script>

<template>
  <div v-if="loading" class="text-center text-gray-500 py-12">Cargando...</div>

  <div v-else-if="!product" class="text-center py-12">
    <p class="text-gray-500">Producto no encontrado.</p>
    <RouterLink to="/" class="mt-4 inline-block text-indigo-600 hover:text-indigo-500">Volver al inicio</RouterLink>
  </div>

  <div v-else>
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <!-- Images -->
      <div>
        <div class="aspect-square overflow-hidden rounded-lg bg-gray-100">
          <img
            v-if="product.images.length > 0"
            :src="product.images[selectedImage]?.url"
            :alt="product.name"
            class="h-full w-full object-cover"
          />
          <div v-else class="flex h-full items-center justify-center text-gray-400">Sin imagen</div>
        </div>
        <div v-if="product.images.length > 1" class="mt-4 flex gap-2 overflow-x-auto">
          <button
            v-for="(img, idx) in product.images"
            :key="img.id"
            :class="['h-16 w-16 overflow-hidden rounded-md border-2', idx === selectedImage ? 'border-indigo-600' : 'border-transparent']"
            @click="selectedImage = idx"
          >
            <img :src="img.url" :alt="`${product.name} ${idx + 1}`" class="h-full w-full object-cover" />
          </button>
        </div>
      </div>

      <!-- Info -->
      <div>
        <RouterLink
          v-if="product.store"
          :to="{ name: 'store-detail', params: { slug: product.store.slug } }"
          class="text-sm text-indigo-600 hover:text-indigo-500"
        >
          {{ product.store.name }}
        </RouterLink>
        <h1 class="mt-1 text-3xl font-bold text-gray-900">{{ product.name }}</h1>
        <p class="mt-4 text-3xl font-bold text-indigo-600">${{ Number(product.price).toFixed(2) }}</p>

        <div v-if="product.categories.length > 0" class="mt-4 flex flex-wrap gap-2">
          <span v-for="cat in product.categories" :key="cat.id" class="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
            {{ cat.name }}
          </span>
        </div>

        <p v-if="product.description" class="mt-6 text-gray-700 leading-relaxed">{{ product.description }}</p>

        <div class="mt-6">
          <p v-if="product.stock > 0" class="text-sm text-green-600">{{ product.stock }} disponibles</p>
          <p v-else class="text-sm text-red-600">Agotado</p>
        </div>

        <div v-if="product.stock > 0" class="mt-6 flex items-center gap-4">
          <div class="flex items-center rounded-md border">
            <button class="px-3 py-2 text-gray-600 hover:bg-gray-100" @click="quantity = Math.max(1, quantity - 1)">−</button>
            <span class="px-4 py-2 text-sm font-medium">{{ quantity }}</span>
            <button class="px-3 py-2 text-gray-600 hover:bg-gray-100" @click="quantity = Math.min(product.stock, quantity + 1)">+</button>
          </div>
          <button
            class="rounded-md bg-indigo-600 px-6 py-2 text-white font-medium hover:bg-indigo-700"
            @click="addToCart"
          >
            {{ added ? '¡Agregado!' : 'Agregar al carrito' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
