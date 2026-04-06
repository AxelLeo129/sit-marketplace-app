<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { Store } from '@/types'

const auth = useAuthStore()
const store = ref<Store | null>(null)
const loading = ref(true)
const showForm = ref(false)
const saving = ref(false)
const error = ref('')

const form = ref({
  name: '',
  description: '',
  phone: '',
  logo_url: '',
})

async function loadStore() {
  loading.value = true
  try {
    // Find the user's store by filtering stores
    const res = await api.get<{ data: Store[] }>(`/stores?user=${auth.user?.id}`)
    store.value = res.data.length > 0 ? res.data[0] : null
    if (store.value) {
      form.value = {
        name: store.value.name,
        description: store.value.description ?? '',
        phone: store.value.phone ?? '',
        logo_url: store.value.logo_url ?? '',
      }
    }
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  saving.value = true
  error.value = ''
  try {
    if (store.value) {
      const res = await api.put<{ data: Store }>(`/stores/${store.value.id}`, form.value)
      store.value = res.data
    } else {
      const res = await api.post<{ data: Store }>('/stores', form.value)
      store.value = res.data
    }
    showForm.value = false
  } catch (e: unknown) {
    const err = e as { message?: string }
    error.value = err.message ?? 'Error al guardar'
  } finally {
    saving.value = false
  }
}

loadStore()
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Mi Tienda</h1>
      <RouterLink
        v-if="store"
        to="/my-products"
        class="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
      >
        Gestionar productos
      </RouterLink>
    </div>

    <div v-if="loading" class="mt-8 text-center text-gray-500">Cargando...</div>

    <!-- No store yet -->
    <div v-else-if="!store && !showForm" class="mt-12 text-center">
      <p class="text-gray-500">Aún no tienes una tienda.</p>
      <button
        class="mt-4 rounded-md bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
        @click="showForm = true"
      >
        Crear mi tienda
      </button>
    </div>

    <!-- Store info -->
    <div v-else-if="store && !showForm" class="mt-6 rounded-lg border bg-white p-6">
      <div class="flex items-center gap-6">
        <div class="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-100">
          <img v-if="store.logo_url" :src="store.logo_url" :alt="store.name" class="h-full w-full object-cover" />
          <div v-else class="flex h-full items-center justify-center text-2xl font-bold text-gray-400">
            {{ store.name.charAt(0) }}
          </div>
        </div>
        <div>
          <h2 class="text-xl font-semibold text-gray-900">{{ store.name }}</h2>
          <p v-if="store.description" class="mt-1 text-gray-600">{{ store.description }}</p>
          <p v-if="store.phone" class="mt-1 text-sm text-gray-500">Tel: {{ store.phone }}</p>
        </div>
      </div>
      <button
        class="mt-4 rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        @click="showForm = true"
      >
        Editar tienda
      </button>
    </div>

    <!-- Form -->
    <div v-if="showForm" class="mt-6 rounded-lg border bg-white p-6">
      <h2 class="text-lg font-semibold text-gray-900">{{ store ? 'Editar' : 'Crear' }} Tienda</h2>

      <div v-if="error" class="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

      <form class="mt-4 space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-sm font-medium text-gray-700">Nombre</label>
          <input v-model="form.name" type="text" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea v-model="form.description" rows="3" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Teléfono</label>
          <input v-model="form.phone" type="tel" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">URL del logo</label>
          <input v-model="form.logo_url" type="url" placeholder="https://..." class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div class="flex gap-3">
          <button type="submit" :disabled="saving" class="rounded-md bg-indigo-600 px-6 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
          <button type="button" class="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" @click="showForm = false">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
