<script setup lang="ts">
/**
 * Inicio: saludo y un resumen de lo que cada rol tiene pendiente o ha logrado.
 * Cada indicador se carga por separado; si uno falla, muestra "—" sin afectar a los demás.
 */
import { onMounted, ref, type Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import {
  BadgeDollarSign,
  CalendarClock,
  FileText,
  HandCoins,
  Navigation,
  PackageCheck,
  PackageX,
  PiggyBank,
  ReceiptText,
  Sparkles,
  Stethoscope,
  Truck,
} from 'lucide-vue-next'
import StatTile from '@/components/charts/StatTile.vue'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { Collection } from '@/types/api'
import type { MyCommissionsReport, SalesReport } from '@/types/report'
import type { Role } from '@/types/user'
import { formatMoney } from '@/utils/format'

interface Tile {
  label: string
  icon: Component
  to?: RouteLocationRaw
  load: () => Promise<string>
}

const auth = useAuthStore()

/** Cantidad de registros de una lista paginada (sin traerlos todos). */
async function count(endpoint: string): Promise<string> {
  const separator = endpoint.includes('?') ? '&' : '?'
  const response = await api.get<Collection<unknown>>(`${endpoint}${separator}per_page=1`)
  return String(response.meta?.total ?? response.data.length)
}

/** Total de mis comisiones del mes en curso. */
async function myCommissions(): Promise<string> {
  const response = await api.get<MyCommissionsReport>('/reports/my-commissions?per_page=1')
  return formatMoney(response.total)
}

const myCommissionsTile: Tile = {
  label: 'Mis comisiones del mes',
  icon: HandCoins,
  to: { name: 'my-commissions' },
  load: myCommissions,
}

/** Indicadores de cada rol. */
function tilesFor(role: Role): Tile[] {
  switch (role) {
    case 'admin': {
      // Un solo reporte alimenta los tres indicadores de ventas.
      const sales = api.get<SalesReport>('/reports/sales')
      return [
        {
          label: 'Ventas del mes',
          icon: BadgeDollarSign,
          to: { name: 'sales-report' },
          load: async () => formatMoney((await sales).summary.sales),
        },
        {
          label: 'Pedidos entregados en el mes',
          icon: PackageCheck,
          to: { name: 'sales-report' },
          load: async () => String((await sales).summary.orders_count),
        },
        {
          label: 'Utilidad del mes',
          icon: PiggyBank,
          to: { name: 'sales-report' },
          load: async () => formatMoney((await sales).summary.profit),
        },
        {
          label: 'Pedidos por facturar',
          icon: ReceiptText,
          to: { name: 'orders' },
          load: () => count('/orders?status=pending_invoice'),
        },
      ]
    }
    case 'doctor':
      return [
        {
          label: 'Recetas nuevas',
          icon: FileText,
          to: { name: 'prescriptions' },
          load: () => count('/prescriptions?status=pending'),
        },
        myCommissionsTile,
      ]
    case 'sales_rep':
      return [
        {
          label: 'Mis médicos',
          icon: Stethoscope,
          to: { name: 'users' },
          load: () => count('/users'),
        },
        myCommissionsTile,
      ]
    case 'call_center':
      return [
        {
          label: 'Recetas nuevas por llamar',
          icon: FileText,
          to: { name: 'prescriptions' },
          load: () => count('/prescriptions?status=pending'),
        },
        {
          label: 'Llamadas reagendadas',
          icon: CalendarClock,
          to: { name: 'prescriptions' },
          load: () => count('/prescriptions?status=rescheduled'),
        },
        myCommissionsTile,
      ]
    case 'billing':
      return [
        {
          label: 'Pedidos por facturar',
          icon: ReceiptText,
          to: { name: 'orders' },
          load: () => count('/orders?status=pending_invoice'),
        },
      ]
    case 'dispatcher':
      return [
        {
          label: 'Pedidos por asignar',
          icon: Truck,
          to: { name: 'orders' },
          load: () => count('/orders?status=invoiced'),
        },
        {
          label: 'Entregas fallidas por resolver',
          icon: PackageX,
          to: { name: 'orders' },
          load: () => count('/orders?status=delivery_failed'),
        },
      ]
    case 'courier':
      return [
        {
          label: 'Pedidos asignados',
          icon: Truck,
          to: { name: 'orders' },
          load: () => count('/orders?status=assigned'),
        },
        {
          label: 'En ruta',
          icon: Navigation,
          to: { name: 'orders' },
          load: () => count('/orders?status=in_transit'),
        },
        myCommissionsTile,
      ]
  }
}

const tiles = ref<(Tile & { value: string | null })[]>([])

onMounted(() => {
  if (!auth.user) return

  tiles.value = tilesFor(auth.user.role).map((tile) => ({ ...tile, value: null }))
  tiles.value.forEach((tile) => {
    tile
      .load()
      .then((value) => (tile.value = value))
      .catch(() => (tile.value = '—'))
  })
})
</script>

<template>
  <div v-if="auth.user" class="space-y-6">
    <!-- Tarjeta de bienvenida con el degradado de Vuexy. -->
    <section
      class="bg-primary-gradient relative overflow-hidden rounded-lg p-8 text-center text-white shadow-card"
    >
      <span class="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-white/20">
        <Sparkles class="size-7" />
      </span>
      <h1 class="mb-2 text-2xl text-white">Bienvenido, {{ auth.user.name }}</h1>
      <p class="text-white/90">Has iniciado sesión como {{ auth.user.role_label }}.</p>
    </section>

    <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        v-for="tile in tiles"
        :key="tile.label"
        :label="tile.label"
        :value="tile.value"
        :icon="tile.icon"
        :to="tile.to"
      />
    </div>
  </div>
</template>
