<script setup lang="ts">
/**
 * Reporte de ventas del administrador. Solo cuentan los pedidos entregados,
 * por su fecha de entrega; "pedidos por estado" cuenta los creados en el período.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { BadgeDollarSign, HandCoins, PackageCheck, PiggyBank, TrendingUp } from 'lucide-vue-next'
import BarList from '@/components/charts/BarList.vue'
import ColumnChart from '@/components/charts/ColumnChart.vue'
import StatTile from '@/components/charts/StatTile.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import { api, ApiError } from '@/services/api'
import { orderStatusLabels, type OrderStatus } from '@/types/order'
import type { SalesReport } from '@/types/report'
import { thisMonth } from '@/utils/dates'
import { formatDate, formatMoney, formatMoneyCompact } from '@/utils/format'
import PeriodFilter from './components/PeriodFilter.vue'

const [monthStart, today] = thisMonth()
const filters = reactive({ from: monthStart, to: today, group_by: 'day' as 'day' | 'month' })
const groupOptions = [
  { value: 'day', label: 'Por día' },
  { value: 'month', label: 'Por mes' },
] as const

const report = ref<SalesReport | null>(null)
const loading = ref(false)
const error = ref('')

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams(filters)
    report.value = await api.get<SalesReport>(`/reports/sales?${params}`)
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'No se pudo cargar el reporte.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(filters, load)

const summary = computed(() => report.value?.summary)
const money = (value: string | undefined) => (value === undefined ? null : formatMoney(value))

/** "2026-10-05" → "05/10"; "2026-10" → "10/2026". */
function periodLabel(period: string): string {
  if (period.length === 7) {
    const [year, month] = period.split('-')
    return `${month}/${year}`
  }
  return formatDate(period).slice(0, 5)
}

const points = computed(() =>
  (report.value?.series ?? []).map((row) => ({
    label: periodLabel(row.period),
    value: Number(row.sales),
    details: [
      { label: 'Pedidos', value: String(row.orders_count) },
      { label: 'Margen', value: formatMoney(row.gross_margin) },
    ],
  })),
)

const topProducts = computed(() =>
  (report.value?.top_products ?? []).map((product) => ({
    label: product.name,
    value: Number(product.sales),
    hint: `${product.units} unidades · margen ${formatMoney(product.gross_margin)}`,
  })),
)

const ordersByStatus = computed(() =>
  Object.entries(report.value?.orders_by_status ?? {}).map(([status, count]) => ({
    label: orderStatusLabels[status as OrderStatus],
    value: count,
  })),
)
</script>

<template>
  <h2 class="mb-2 text-2xl">Reporte de ventas</h2>
  <p class="mb-6 text-sm">Pedidos entregados en el período, por fecha de entrega.</p>

  <!-- Filtros: una fila arriba de todo lo que afectan. -->
  <div class="mb-6 flex flex-wrap items-end gap-4 rounded-lg bg-white p-5 shadow-card">
    <PeriodFilter v-model:from="filters.from" v-model:to="filters.to" />
    <div class="flex gap-1 rounded-full bg-black/5 p-1" role="radiogroup" aria-label="Agrupar por">
      <button
        v-for="option in groupOptions"
        :key="option.value"
        type="button"
        role="radio"
        :aria-checked="filters.group_by === option.value"
        class="cursor-pointer rounded-full px-4 py-1 text-sm"
        :class="filters.group_by === option.value ? 'bg-white text-primary shadow' : ''"
        @click="filters.group_by = option.value"
      >
        {{ option.label }}
      </button>
    </div>
  </div>

  <BaseAlert v-if="error" variant="danger" class="mb-6">{{ error }}</BaseAlert>

  <!-- Al recargar se conserva lo anterior, atenuado, para no saltar. -->
  <div class="space-y-6 transition-opacity" :class="{ 'opacity-50': loading && report }">
    <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
      <StatTile label="Ventas (con IVA)" :value="money(summary?.sales)" :icon="BadgeDollarSign" />
      <StatTile
        label="Pedidos entregados"
        :value="summary ? String(summary.orders_count) : null"
        :hint="summary ? `${summary.units} unidades` : undefined"
        :icon="PackageCheck"
      />
      <StatTile label="Margen bruto" :value="money(summary?.gross_margin)" :icon="TrendingUp" />
      <StatTile label="Comisiones" :value="money(summary?.commissions)" :icon="HandCoins" />
      <StatTile
        label="Utilidad"
        hint="Margen menos comisiones"
        :value="money(summary?.profit)"
        :icon="PiggyBank"
      />
    </div>

    <div class="grid gap-6 sm:grid-cols-3">
      <StatTile label="IVA" :value="money(summary?.vat)" />
      <StatTile label="Costo de lo vendido" :value="money(summary?.cost)" />
      <StatTile label="Cargos por tarjeta" :value="money(summary?.card_fees)" />
    </div>

    <BaseCard :title="filters.group_by === 'day' ? 'Ventas por día' : 'Ventas por mes'">
      <div v-if="!report" class="h-64 animate-pulse rounded bg-black/5" />
      <ColumnChart v-else :points="points" series-label="Ventas" :format="formatMoneyCompact" />
    </BaseCard>

    <div class="grid gap-6 lg:grid-cols-2">
      <BaseCard title="Productos más vendidos">
        <div v-if="!report" class="h-48 animate-pulse rounded bg-black/5" />
        <BarList v-else :items="topProducts" :format="formatMoney" />
      </BaseCard>
      <BaseCard title="Pedidos creados por estado">
        <div v-if="!report" class="h-48 animate-pulse rounded bg-black/5" />
        <BarList v-else :items="ordersByStatus" />
      </BaseCard>
    </div>
  </div>
</template>
