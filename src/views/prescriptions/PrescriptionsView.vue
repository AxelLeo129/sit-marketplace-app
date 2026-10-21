<script setup lang="ts">
/**
 * Listado de recetas. El médico ve las suyas; el call-center, las que puede atender;
 * el administrador, todas. Las reagendadas se ordenan por la hora de la llamada.
 */
import { computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Eye, Plus, Search } from 'lucide-vue-next'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BasePagination from '@/components/ui/BasePagination.vue'
import TableSkeleton from '@/components/ui/TableSkeleton.vue'
import { usePaginatedList } from '@/composables/usePaginatedList'
import { useAuthStore } from '@/stores/auth'
import {
  prescriptionStatusLabels,
  prescriptionStatusVariants,
  type Prescription,
  type PrescriptionStatus,
} from '@/types/prescription'
import { formatDate, formatDateTime } from '@/utils/format'

type PrescriptionFilters = {
  status: PrescriptionStatus | null
  search: string
  issued_from: string
  issued_to: string
}

const auth = useAuthStore()
const router = useRouter()
const isDoctor = computed(() => auth.hasRole('doctor'))

const list = usePaginatedList<Prescription, PrescriptionFilters>('/prescriptions', {
  status: null,
  search: '',
  issued_from: '',
  issued_to: '',
})

const statusTabs: { value: PrescriptionStatus | null; label: string }[] = [
  { value: null, label: 'Todas' },
  ...Object.entries(prescriptionStatusLabels).map(([value, label]) => ({
    value: value as PrescriptionStatus,
    label,
  })),
]

onMounted(list.load)

function open(prescription: Prescription): void {
  router.push({ name: 'prescription', params: { id: prescription.id } })
}
</script>

<template>
  <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <h2 class="text-2xl">{{ isDoctor ? 'Mis recetas' : 'Recetas' }}</h2>
    <RouterLink
      v-if="isDoctor"
      :to="{ name: 'prescription-create' }"
      class="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 font-medium text-white hover:shadow-[0_8px_25px_-8px_var(--color-primary)]"
    >
      <Plus class="size-4" /> Nueva receta
    </RouterLink>
  </div>

  <div class="mb-4 space-y-4 rounded-lg bg-white p-5 shadow-card">
    <!-- Pestañas por estado. -->
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
        placeholder="Paciente o teléfono"
        :icon="Search"
        class="md:col-span-2"
      />
      <BaseInput v-model="list.filters.issued_from" type="date" label="Desde" />
      <BaseInput v-model="list.filters.issued_to" type="date" label="Hasta" />
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
          <th>Paciente</th>
          <th v-if="!isDoctor">Médico</th>
          <th>Fecha</th>
          <th>Medicamentos</th>
          <th>Estado</th>
          <th class="text-right">Ver</th>
        </tr>
      </thead>
      <tbody>
        <TableSkeleton
          v-if="list.loading.value && list.items.value.length === 0"
          :columns="isDoctor ? 6 : 7"
        />
        <tr
          v-for="prescription in list.items.value"
          :key="prescription.id"
          class="cursor-pointer"
          @click="open(prescription)"
        >
          <td class="font-semibold text-heading">{{ prescription.id }}</td>
          <td>
            <p class="font-medium text-heading">{{ prescription.patient_name }}</p>
            <p class="text-xs">{{ prescription.patient_phone }}</p>
          </td>
          <td v-if="!isDoctor">{{ prescription.doctor.name }}</td>
          <td class="whitespace-nowrap">{{ formatDate(prescription.issued_on) }}</td>
          <td>{{ prescription.items.length }}</td>
          <td>
            <BaseBadge :variant="prescriptionStatusVariants[prescription.status]">
              {{ prescription.status_label }}
            </BaseBadge>
            <p
              v-if="prescription.status === 'rescheduled' && prescription.callback_at"
              class="mt-1 text-xs whitespace-nowrap"
            >
              Llamar: {{ formatDateTime(prescription.callback_at) }}
            </p>
          </td>
          <td class="text-right">
            <RouterLink
              :to="{ name: 'prescription', params: { id: prescription.id } }"
              class="inline-block p-1 hover:text-primary"
              :aria-label="`Ver receta ${prescription.id}`"
              @click.stop
            >
              <Eye class="size-4" />
            </RouterLink>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="!list.loading.value && list.items.value.length === 0" class="py-8 text-center">
      No se encontraron recetas.
    </p>
  </div>

  <BasePagination v-if="list.meta.value" :meta="list.meta.value" @change="list.goToPage" />
</template>
