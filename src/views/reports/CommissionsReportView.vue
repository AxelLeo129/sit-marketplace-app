<script setup lang="ts">
/**
 * Comisiones por beneficiario (administrador): cuánto se le debe a cada
 * médico, visitador, agente de call-center y mensajero en el período.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { HandCoins } from 'lucide-vue-next'
import StatTile from '@/components/charts/StatTile.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import TableSkeleton from '@/components/ui/TableSkeleton.vue'
import { api, ApiError } from '@/services/api'
import type { CommissionsReport } from '@/types/report'
import { roleLabels, type Role } from '@/types/user'
import { thisMonth } from '@/utils/dates'
import { formatMoney } from '@/utils/format'
import PeriodFilter from './components/PeriodFilter.vue'

/** Roles que cobran comisión. */
const earnerRoles: Role[] = ['doctor', 'sales_rep', 'call_center', 'courier']
const roleOptions = earnerRoles.map((role) => ({ value: role, label: roleLabels[role] }))

const [monthStart, today] = thisMonth()
const filters = reactive({ from: monthStart, to: today, role: null as Role | null })

const report = ref<CommissionsReport | null>(null)
const loading = ref(false)
const error = ref('')

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({ from: filters.from, to: filters.to })
    if (filters.role) params.set('role', filters.role)
    report.value = await api.get<CommissionsReport>(`/reports/commissions?${params}`)
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'No se pudo cargar el reporte.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(filters, load)

/** Para la barra de cada fila: proporción respecto al que más cobra. */
const maxAmount = computed(() =>
  Math.max(...(report.value?.data ?? []).map((row) => Number(row.amount)), 1),
)
</script>

<template>
  <h2 class="mb-2 text-2xl">Comisiones</h2>
  <p class="mb-6 text-sm">Comisiones de pedidos entregados en el período, por beneficiario.</p>

  <div class="mb-6 flex flex-wrap items-end gap-4 rounded-lg bg-white p-5 shadow-card">
    <PeriodFilter v-model:from="filters.from" v-model:to="filters.to" />
    <BaseSelect
      v-model="filters.role"
      label="Rol"
      :options="roleOptions"
      placeholder="Todos"
      class="w-44"
    />
  </div>

  <BaseAlert v-if="error" variant="danger" class="mb-6">{{ error }}</BaseAlert>

  <div class="transition-opacity" :class="{ 'opacity-50': loading && report }">
    <StatTile
      label="Total de comisiones"
      :value="report ? formatMoney(report.total) : null"
      :icon="HandCoins"
      class="mb-6 max-w-sm"
    />

    <div class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th>Beneficiario</th>
            <th>Rol</th>
            <th class="text-right">Pedidos</th>
            <th class="w-1/3">Comisión</th>
          </tr>
        </thead>
        <tbody class="tabular-nums">
          <TableSkeleton v-if="!report" :columns="4" />
          <tr v-for="row in report?.data ?? []" :key="`${row.user_id}-${row.role}`">
            <td class="font-medium text-heading">{{ row.name }}</td>
            <td>{{ row.role_label }}</td>
            <td class="text-right">{{ row.orders_count }}</td>
            <td>
              <div class="flex items-center gap-3">
                <div class="h-2 flex-1 rounded-full bg-chart-grid" aria-hidden="true">
                  <div
                    class="h-2 rounded-full bg-chart"
                    :style="{ width: `${(Number(row.amount) / maxAmount) * 100}%` }"
                  />
                </div>
                <span class="w-24 text-right font-semibold text-heading">
                  {{ formatMoney(row.amount) }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="report && report.data.length === 0" class="py-8 text-center">
        No hay comisiones en este período.
      </p>
    </div>
  </div>
</template>
