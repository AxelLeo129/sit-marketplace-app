<script setup lang="ts">
/**
 * Barras horizontales de una sola serie para comparar cantidades
 * (productos más vendidos, pedidos por estado). El valor va al final de la barra.
 */
import { computed } from 'vue'

export interface BarItem {
  label: string
  value: number
  /** Texto secundario bajo la etiqueta, p. ej. "12 unidades". */
  hint?: string
}

const props = withDefaults(
  defineProps<{ items: BarItem[]; format?: (value: number) => string }>(),
  { format: (value: number) => value.toLocaleString('es-GT') },
)

const max = computed(() => Math.max(...props.items.map((item) => item.value), 1))
</script>

<template>
  <p v-if="items.length === 0" class="py-8 text-center">Sin datos en este período.</p>
  <ul v-else class="space-y-3">
    <li v-for="item in items" :key="item.label" :title="`${item.label}: ${format(item.value)}`">
      <div class="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span class="truncate text-heading">{{ item.label }}</span>
        <span class="shrink-0 font-semibold text-heading tabular-nums">{{
          format(item.value)
        }}</span>
      </div>
      <div class="h-2 rounded-full bg-chart-grid" aria-hidden="true">
        <div
          class="h-2 rounded-full bg-chart"
          :style="{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 2 : 0)}%` }"
        />
      </div>
      <p v-if="item.hint" class="mt-1 text-xs">{{ item.hint }}</p>
    </li>
  </ul>
</template>
