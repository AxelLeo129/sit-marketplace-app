<script setup lang="ts">
/**
 * Listado de pedidos. La API filtra según el rol: el despachador no ve los
 * pendientes de factura y el mensajero solo ve los suyos.
 */
import { onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Eye, Search } from 'lucide-vue-next'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BasePagination from '@/components/ui/BasePagination.vue'
import TableSkeleton from '@/components/ui/TableSkeleton.vue'
import { usePaginatedList } from '@/composables/usePaginatedList'
import { orderStatusLabels, orderStatusVariants, type Order, type OrderStatus } from '@/types/order'
import { formatDateTime, formatMoney } from '@/utils/format'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/types/user'

type OrderFilters = {
  status: OrderStatus | null
  search: string
  created_from: string
  created_to: string
}

const auth = useAuthStore()
const router = useRouter()

/**
 * Facturación y despacho abren la lista en los pedidos que les toca trabajar.
 * El mensajero ve todos los suyos (asignados y en ruta).
 */
const startingStatus: Partial<Record<Role, OrderStatus>> = {
  billing: 'pending_invoice',
  dispatcher: 'invoiced',
}

const list = usePaginatedList<Order, OrderFilters>('/orders', {
  status: auth.user ? (startingStatus[auth.user.role] ?? null) : null,
  search: '',
  created_from: '',
  created_to: '',
})

const statusTabs: { value: OrderStatus | null; label: string }[] = [
  { value: null, label: 'Todos' },
  ...Object.entries(orderStatusLabels).map(([value, label]) => ({
    value: value as OrderStatus,
    label,
  })),
]

onMounted(list.load)

function open(order: Order): void {
  router.push({ name: 'order', params: { id: order.id } })
}
</script>

<template>
  <h2 class="mb-6 text-2xl">{{ auth.hasRole('courier') ? 'Mis entregas' : 'Pedidos' }}</h2>

  <div class="mb-4 space-y-4 rounded-lg bg-white p-5 shadow-card">
    <div class="flex flex-wrap gap-2" role="tablist">
      <button
        v-for="tab in statusTabs"
        :key="tab.label"
        type="button"
        role="tab"
        :aria-selected="list.filters.status === tab.value"
        class="cursor-pointer rounded-full px-4 py-1.5 text-sm transition-colors"
        :class="
          list.filters.status === tab.value
            ? 'bg-primary text-white'
            : 'bg-black/5 hover:bg-primary/10 hover:text-primary'
        "
        @click="list.filters.status = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="grid gap-4 md:grid-cols-4">
      <BaseInput
        v-model="list.filters.search"
        placeholder="No. de pedido, cliente o teléfono"
        :icon="Search"
        class="md:col-span-2"
      />
      <BaseInput v-model="list.filters.created_from" type="date" label="Desde" />
      <BaseInput v-model="list.filters.created_to" type="date" label="Hasta" />
    </div>
  </div>

  <BaseAlert v-if="list.error.value" variant="danger">{{ list.error.value }}</BaseAlert>

  <div
    class="overflow-x-auto transition-opacity"
    :class="{ 'opacity-50': list.loading.value }"
    :aria-busy="list.loading.value"
  >
    <table class="data-table">
      <thead>
        <tr>
          <th>No.</th>
          <th>Cliente</th>
          <th>Creado</th>
          <th>Total</th>
          <th>Pago</th>
          <th>Mensajero</th>
          <th>Estado</th>
          <th class="text-right">Ver</th>
        </tr>
      </thead>
      <tbody>
        <TableSkeleton v-if="list.loading.value && list.items.value.length === 0" :columns="8" />
        <tr
          v-for="order in list.items.value"
          :key="order.id"
          class="cursor-pointer"
          @click="open(order)"
        >
          <td class="font-semibold text-heading">{{ order.id }}</td>
          <td>
            <p class="font-medium text-heading">{{ order.customer.name }}</p>
            <p class="text-xs">{{ order.customer.phone }}</p>
          </td>
          <td class="whitespace-nowrap">{{ formatDateTime(order.created_at) }}</td>
          <td class="whitespace-nowrap">{{ formatMoney(order.total) }}</td>
          <td>{{ order.payment.method_label }}</td>
          <td>{{ order.delivery.courier?.name ?? '—' }}</td>
          <td>
            <BaseBadge :variant="orderStatusVariants[order.status]">
              {{ order.status_label }}
            </BaseBadge>
          </td>
          <td class="text-right">
            <RouterLink
              :to="{ name: 'order', params: { id: order.id } }"
              class="inline-block p-1 hover:text-primary"
              :aria-label="`Ver pedido ${order.id}`"
              @click.stop
            >
              <Eye class="size-4" />
            </RouterLink>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="!list.loading.value && list.items.value.length === 0" class="py-8 text-center">
      No se encontraron pedidos.
    </p>
  </div>

  <BasePagination v-if="list.meta.value" :meta="list.meta.value" @change="list.goToPage" />
</template>
