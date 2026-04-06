<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/services/api'
import { useCartStore } from '@/stores/cart'
import type { Order, Address, PaginatedResponse, StoreOrderPayload } from '@/types'

const cart = useCartStore()
const orders = ref<Order[]>([])
const addresses = ref<Address[]>([])
const selectedAddressId = ref<number | null>(null)
const notes = ref('')
const loading = ref(false)
const placing = ref(false)
const showCheckout = ref(false)
const error = ref('')

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

async function loadOrders() {
  loading.value = true
  try {
    const res = await api.get<PaginatedResponse<Order>>('/orders')
    orders.value = res.data
  } finally {
    loading.value = false
  }
}

async function loadAddresses() {
  const res = await api.get<{ data: Address[] }>('/addresses')
  addresses.value = res.data
  const defaultAddr = addresses.value.find((a) => a.is_default)
  if (defaultAddr) selectedAddressId.value = defaultAddr.id
}

async function placeOrder() {
  if (!selectedAddressId.value) {
    error.value = 'Selecciona una dirección de envío'
    return
  }
  if (cart.items.length === 0) {
    error.value = 'Tu carrito está vacío'
    return
  }

  error.value = ''
  placing.value = true
  try {
    const payload: StoreOrderPayload = {
      address_id: selectedAddressId.value,
      notes: notes.value || undefined,
      items: cart.items.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
      })),
    }
    await api.post('/orders', payload)
    cart.clear()
    showCheckout.value = false
    notes.value = ''
    await loadOrders()
  } catch (e: unknown) {
    const err = e as { message?: string }
    error.value = err.message ?? 'Error al crear el pedido'
  } finally {
    placing.value = false
  }
}

function openCheckout() {
  showCheckout.value = true
  loadAddresses()
}

loadOrders()
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Mis Pedidos</h1>
      <button
        v-if="cart.totalItems > 0 && !showCheckout"
        class="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        @click="openCheckout"
      >
        Confirmar pedido ({{ cart.totalItems }} productos)
      </button>
    </div>

    <!-- Checkout -->
    <div v-if="showCheckout" class="mt-6 rounded-lg border bg-white p-6">
      <h2 class="text-lg font-semibold text-gray-900">Confirmar Pedido</h2>

      <div v-if="error" class="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{{ error }}</div>

      <div class="mt-4">
        <label class="block text-sm font-medium text-gray-700">Dirección de envío</label>
        <div v-if="addresses.length === 0" class="mt-2 text-sm text-gray-500">
          No tienes direcciones registradas.
          <RouterLink to="/addresses" class="text-indigo-600">Agregar dirección</RouterLink>
        </div>
        <select
          v-else
          v-model="selectedAddressId"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
        >
          <option v-for="addr in addresses" :key="addr.id" :value="addr.id">
            {{ addr.label }} — {{ addr.street }}, {{ addr.city }}
          </option>
        </select>
      </div>

      <div class="mt-4">
        <label for="notes" class="block text-sm font-medium text-gray-700">Notas (opcional)</label>
        <textarea
          id="notes"
          v-model="notes"
          rows="2"
          class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
        />
      </div>

      <div class="mt-4 text-right text-lg font-bold text-indigo-600">
        Total: ${{ cart.totalPrice.toFixed(2) }}
      </div>

      <div class="mt-4 flex justify-end gap-3">
        <button class="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" @click="showCheckout = false">Cancelar</button>
        <button
          :disabled="placing"
          class="rounded-md bg-indigo-600 px-6 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
          @click="placeOrder"
        >
          {{ placing ? 'Procesando...' : 'Realizar Pedido' }}
        </button>
      </div>
    </div>

    <!-- Orders list -->
    <div v-if="loading" class="mt-8 text-center text-gray-500">Cargando...</div>

    <div v-else-if="orders.length === 0 && !showCheckout" class="mt-12 text-center text-gray-500">
      No tienes pedidos aún.
    </div>

    <div v-else class="mt-8 space-y-4">
      <div v-for="order in orders" :key="order.id" class="rounded-lg border bg-white p-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span class="text-sm text-gray-500">Pedido #{{ order.id }}</span>
            <span :class="[statusColors[order.status], 'ml-3 rounded-full px-2 py-1 text-xs font-medium']">
              {{ statusLabels[order.status] }}
            </span>
          </div>
          <span class="text-lg font-bold text-indigo-600">${{ Number(order.total).toFixed(2) }}</span>
        </div>

        <div v-if="order.address" class="mt-2 text-sm text-gray-500">
          Envío a: {{ order.address.street }}, {{ order.address.city }}
        </div>

        <div class="mt-4 divide-y">
          <div v-for="item in order.items" :key="item.id" class="flex items-center gap-3 py-2">
            <div class="h-10 w-10 shrink-0 overflow-hidden rounded bg-gray-100">
              <img
                v-if="item.product?.images?.length"
                :src="item.product.images[0].url"
                class="h-full w-full object-cover"
              />
            </div>
            <div class="flex-1">
              <p class="text-sm text-gray-900">{{ item.product?.name ?? `Producto #${item.product_id}` }}</p>
              <p class="text-xs text-gray-500">{{ item.quantity }} × ${{ Number(item.unit_price).toFixed(2) }}</p>
            </div>
            <span class="text-sm font-medium">${{ Number(item.subtotal).toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
