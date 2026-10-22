<script setup lang="ts">
/**
 * Mis comisiones: lo que gana el usuario (médico, visitador, call-center o mensajero)
 * por cada producto de pedidos entregados en el período. No muestra costos ni márgenes.
 */
import { onMounted, reactive, ref, watch } from 'vue'
import { HandCoins, PackageCheck } from 'lucide-vue-next'
import StatTile from '@/components/charts/StatTile.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BasePagination from '@/components/ui/BasePagination.vue'
import TableSkeleton from '@/components/ui/TableSkeleton.vue'
import { api, ApiError } from '@/services/api'
import type { MyCommissionsReport } from '@/types/report'
import { thisMonth } from '@/utils/dates'
import { formatDateTime, formatMoney } from '@/utils/format'
import PeriodFilter from './components/PeriodFilter.vue'

const [monthStart, today] = thisMonth()
const filters = reactive({ from: monthStart, to: today })
const page = ref(1)

const report = ref<MyCommissionsReport | null>(null)
const loading = ref(false)
const error = ref('')

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({ ...filters, page: String(page.value) })
    report.value = await api.get<MyCommissionsReport>(`/reports/my-commissions?${params}`)
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'No se pudo cargar el reporte.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(filters, () => {
  page.value = 1
  load()
})

function goToPage(newPage: number): void {
  page.value = newPage
  load()
}
</script>

<template>
  <h2 class="mb-2 text-2xl">Mis comisiones</h2>
  <p class="mb-6 text-sm">Comisiones de pedidos entregados en el período.</p>

  <div class="mb-6 rounded-lg bg-white p-5 shadow-card">
    <PeriodFilter v-model:from="filters.from" v-model:to="filters.to" />
  </div>

  <BaseAlert v-if="error" variant="danger" class="mb-6">{{ error }}</BaseAlert>

  <div class="transition-opacity" :class="{ 'opacity-50': loading && report }">
    <div class="mb-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      <StatTile
        label="Total del período"
        :value="report ? formatMoney(report.total) : null"
        :icon="HandCoins"
      />
      <StatTile
        label="Productos vendidos con comisión"
        :value="report ? String(report.meta.total) : null"
        :icon="PackageCheck"
      />
    </div>

    <div class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th>Entregado</th>
            <th>Pedido</th>
            <th>Producto</th>
            <th class="text-right">Cant.</th>
            <th class="text-right">Tasa</th>
            <th class="text-right">Comisión</th>
          </tr>
        </thead>
        <tbody class="tabular-nums">
          <TableSkeleton v-if="!report" :columns="6" />
          <tr v-for="line in report?.data ?? []" :key="line.id">
            <td class="whitespace-nowrap">{{ formatDateTime(line.delivered_at) }}</td>
            <td>No. {{ line.order_id }}</td>
            <td class="text-heading">{{ line.product_name }}</td>
            <td class="text-right">{{ line.quantity }}</td>
            <td class="text-right">{{ Number(line.rate) }} %</td>
            <td class="text-right font-semibold text-heading">{{ formatMoney(line.amount) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="report && report.data.length === 0" class="py-8 text-center">
        No tienes comisiones en este período.
      </p>
    </div>

    <BasePagination v-if="report" :meta="report.meta" @change="goToPage" />
  </div>
</template>
