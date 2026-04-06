<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { Product, Category, Store } from '@/types'

const props = defineProps<{ id?: string }>()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const categories = ref<Category[]>([])
const store = ref<Store | null>(null)
const isEdit = ref(false)

const form = ref({
  name: '',
  description: '',
  price: '',
  stock: 0,
  is_active: true,
  category_ids: [] as number[],
  image_urls: [''] as string[],
})

async function loadCategories() {
  const res = await api.get<{ data: Category[] }>('/categories')
  categories.value = res.data
}

async function loadStore() {
  const res = await api.get<{ data: Store[] }>(`/stores?user=${auth.user?.id}`)
  store.value = res.data.length > 0 ? res.data[0] : null
}

async function loadProduct() {
  if (!props.id) return
  isEdit.value = true
  loading.value = true
  try {
    const res = await api.get<{ data: Product }>(`/products/${props.id}`)
    const p = res.data
    form.value = {
      name: p.name,
      description: p.description ?? '',
      price: String(p.price),
      stock: p.stock,
      is_active: p.is_active,
      category_ids: p.categories.map((c) => c.id),
      image_urls: p.images.length > 0 ? p.images.map((i) => i.url) : [''],
    }
  } finally {
    loading.value = false
  }
}

function addImageField() {
  form.value.image_urls.push('')
}

function removeImageField(index: number) {
  form.value.image_urls.splice(index, 1)
}

async function handleSubmit() {
  if (!store.value) return

  saving.value = true
  error.value = ''
  try {
    const payload = {
      store_id: store.value.id,
      name: form.value.name,
      description: form.value.description || null,
      price: Number(form.value.price),
      stock: form.value.stock,
      is_active: form.value.is_active,
      category_ids: form.value.category_ids,
      image_urls: form.value.image_urls.filter((url) => url.trim() !== ''),
    }

    if (isEdit.value && props.id) {
      await api.put(`/products/${props.id}`, payload)
    } else {
      await api.post('/products', payload)
    }

    router.push('/my-products')
  } catch (e: unknown) {
    const err = e as { message?: string }
    error.value = err.message ?? 'Error al guardar'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadCategories(), loadStore(), loadProduct()])
})
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? 'Editar' : 'Nuevo' }} Producto</h1>

    <div v-if="loading" class="mt-8 text-center text-gray-500">Cargando...</div>

    <form v-else class="mt-6 space-y-5" @submit.prevent="handleSubmit">
      <div v-if="error" class="rounded-md bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Nombre</label>
        <input v-model="form.name" type="text" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Descripción</label>
        <textarea v-model="form.description" rows="4" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Precio</label>
          <input v-model="form.price" type="number" step="0.01" min="0" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Stock</label>
          <input v-model.number="form.stock" type="number" min="0" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <input v-model="form.is_active" type="checkbox" id="is-active" class="text-indigo-600" />
        <label for="is-active" class="text-sm text-gray-700">Producto activo</label>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Categorías</label>
        <div class="mt-2 flex flex-wrap gap-2">
          <label v-for="cat in categories" :key="cat.id" class="flex items-center gap-1">
            <input v-model="form.category_ids" :value="cat.id" type="checkbox" class="text-indigo-600" />
            <span class="text-sm text-gray-700">{{ cat.name }}</span>
          </label>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Imágenes (URLs)</label>
        <div class="mt-2 space-y-2">
          <div v-for="(_, idx) in form.image_urls" :key="idx" class="flex gap-2">
            <input
              v-model="form.image_urls[idx]"
              type="url"
              placeholder="https://..."
              class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              v-if="form.image_urls.length > 1"
              type="button"
              class="shrink-0 text-red-600 hover:text-red-500 text-sm"
              @click="removeImageField(idx)"
            >
              Quitar
            </button>
          </div>
        </div>
        <button type="button" class="mt-2 text-sm text-indigo-600 hover:text-indigo-500" @click="addImageField">
          + Agregar imagen
        </button>
      </div>

      <div class="flex gap-3 pt-4">
        <button type="submit" :disabled="saving" class="rounded-md bg-indigo-600 px-6 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50">
          {{ saving ? 'Guardando...' : 'Guardar' }}
        </button>
        <button type="button" class="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" @click="router.push('/my-products')">
          Cancelar
        </button>
      </div>
    </form>
  </div>
</template>
