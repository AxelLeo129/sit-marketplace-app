<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/services/api'
import type { Address } from '@/types'

const addresses = ref<Address[]>([])
const loading = ref(false)
const showForm = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const error = ref('')

const form = ref({
  label: '',
  recipient_name: '',
  phone: '',
  country: '',
  state: '',
  city: '',
  street: '',
  apartment: '',
  postal_code: '',
  is_default: false,
})

function resetForm() {
  form.value = { label: '', recipient_name: '', phone: '', country: '', state: '', city: '', street: '', apartment: '', postal_code: '', is_default: false }
  editingId.value = null
  error.value = ''
}

async function loadAddresses() {
  loading.value = true
  try {
    const res = await api.get<{ data: Address[] }>('/addresses')
    addresses.value = res.data
  } finally {
    loading.value = false
  }
}

function openNew() {
  resetForm()
  showForm.value = true
}

function openEdit(addr: Address) {
  editingId.value = addr.id
  form.value = {
    label: addr.label,
    recipient_name: addr.recipient_name,
    phone: addr.phone,
    country: addr.country,
    state: addr.state,
    city: addr.city,
    street: addr.street,
    apartment: addr.apartment ?? '',
    postal_code: addr.postal_code,
    is_default: addr.is_default,
  }
  showForm.value = true
}

async function handleSubmit() {
  saving.value = true
  error.value = ''
  try {
    if (editingId.value) {
      await api.put(`/addresses/${editingId.value}`, form.value)
    } else {
      await api.post('/addresses', form.value)
    }
    showForm.value = false
    resetForm()
    await loadAddresses()
  } catch (e: unknown) {
    const err = e as { message?: string }
    error.value = err.message ?? 'Error al guardar'
  } finally {
    saving.value = false
  }
}

async function deleteAddress(id: number) {
  if (!confirm('¿Eliminar esta dirección?')) return
  await api.delete(`/addresses/${id}`)
  await loadAddresses()
}

loadAddresses()
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Mis Direcciones</h1>
      <button
        v-if="!showForm"
        class="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        @click="openNew"
      >
        Nueva dirección
      </button>
    </div>

    <!-- Form -->
    <div v-if="showForm" class="mt-6 rounded-lg border bg-white p-6">
      <h2 class="text-lg font-semibold text-gray-900">{{ editingId ? 'Editar' : 'Nueva' }} Dirección</h2>

      <div v-if="error" class="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

      <form class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-sm font-medium text-gray-700">Etiqueta</label>
          <input v-model="form.label" type="text" required placeholder="Casa, Oficina..." class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Nombre del destinatario</label>
          <input v-model="form.recipient_name" type="text" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Teléfono</label>
          <input v-model="form.phone" type="tel" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">País</label>
          <input v-model="form.country" type="text" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Estado / Departamento</label>
          <input v-model="form.state" type="text" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Ciudad</label>
          <input v-model="form.city" type="text" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Calle y número</label>
          <input v-model="form.street" type="text" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Apartamento / Suite</label>
          <input v-model="form.apartment" type="text" class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Código postal</label>
          <input v-model="form.postal_code" type="text" required class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none" />
        </div>
        <div class="flex items-center gap-2 sm:col-span-2">
          <input v-model="form.is_default" type="checkbox" id="is-default" class="text-indigo-600" />
          <label for="is-default" class="text-sm text-gray-700">Dirección predeterminada</label>
        </div>
        <div class="flex gap-3 sm:col-span-2">
          <button type="submit" :disabled="saving" class="rounded-md bg-indigo-600 px-6 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
          <button type="button" class="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" @click="showForm = false; resetForm()">
            Cancelar
          </button>
        </div>
      </form>
    </div>

    <!-- List -->
    <div v-if="loading" class="mt-8 text-center text-gray-500">Cargando...</div>

    <div v-else class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div v-for="addr in addresses" :key="addr.id" class="rounded-lg border bg-white p-4">
        <div class="flex items-start justify-between">
          <div>
            <span class="font-medium text-gray-900">{{ addr.label }}</span>
            <span v-if="addr.is_default" class="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">Predeterminada</span>
          </div>
          <div class="flex gap-2">
            <button class="text-sm text-indigo-600 hover:text-indigo-500" @click="openEdit(addr)">Editar</button>
            <button class="text-sm text-red-600 hover:text-red-500" @click="deleteAddress(addr.id)">Eliminar</button>
          </div>
        </div>
        <p class="mt-2 text-sm text-gray-700">{{ addr.recipient_name }}</p>
        <p class="text-sm text-gray-500">{{ addr.street }}{{ addr.apartment ? `, ${addr.apartment}` : '' }}</p>
        <p class="text-sm text-gray-500">{{ addr.city }}, {{ addr.state }} {{ addr.postal_code }}</p>
        <p class="text-sm text-gray-500">{{ addr.country }} · {{ addr.phone }}</p>
      </div>
    </div>
  </div>
</template>
