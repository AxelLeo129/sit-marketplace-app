<script setup lang="ts">
/**
 * Período de un reporte: atajos (este mes, últimos 7 / 30 días, este año)
 * y fechas personalizadas. Va en una sola fila arriba de los reportes.
 */
import BaseInput from '@/components/ui/BaseInput.vue'
import { lastDays, thisMonth, thisYear } from '@/utils/dates'

const from = defineModel<string>('from', { required: true })
const to = defineModel<string>('to', { required: true })

const presets = [
  { label: 'Este mes', range: thisMonth },
  { label: 'Últimos 7 días', range: () => lastDays(7) },
  { label: 'Últimos 30 días', range: () => lastDays(30) },
  { label: 'Este año', range: thisYear },
]

function apply(range: () => [string, string]): void {
  ;[from.value, to.value] = range()
}

function isActive(range: () => [string, string]): boolean {
  const [start, end] = range()
  return from.value === start && to.value === end
}
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <div class="flex flex-wrap gap-2">
      <button
        v-for="preset in presets"
        :key="preset.label"
        type="button"
        class="cursor-pointer rounded-full px-4 py-1.5 text-sm transition-colors"
        :class="
          isActive(preset.range)
            ? 'bg-primary text-white'
            : 'bg-black/5 hover:bg-primary/10 hover:text-primary'
        "
        @click="apply(preset.range)"
      >
        {{ preset.label }}
      </button>
    </div>
    <BaseInput v-model="from" type="date" label="Desde" :max="to" class="w-40" />
    <BaseInput v-model="to" type="date" label="Hasta" :min="from" class="w-40" />
  </div>
</template>
