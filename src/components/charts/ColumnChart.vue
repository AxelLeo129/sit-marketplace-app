<script setup lang="ts">
/**
 * Gráfica de columnas de una sola serie (p. ej. ventas por día).
 *
 * - Columnas de máximo 24 px con la punta redondeada, sobre una sola línea base.
 * - Cada columna muestra su detalle al pasar el mouse o al enfocarla con el teclado.
 * - "Ver como tabla" muestra los mismos datos sin depender del color ni del mouse.
 */
import { computed, ref } from 'vue'

export interface ColumnPoint {
  label: string
  value: number
  /** Datos extra para el tooltip y la tabla, ya formateados. */
  details?: { label: string; value: string }[]
}

const props = withDefaults(
  defineProps<{
    points: ColumnPoint[]
    /** Nombre de la serie, p. ej. "Ventas". */
    seriesLabel: string
    format?: (value: number) => string
    height?: number
  }>(),
  { format: (value: number) => value.toLocaleString('es-GT'), height: 240 },
)

const showTable = ref(false)
const active = ref<number | null>(null)

/** Máximo "redondo" del eje y sus 4 marcas (0, 25 %, 50 %, 75 %, 100 %). */
const scale = computed(() => {
  const max = Math.max(...props.points.map((point) => point.value), 0)
  if (max === 0) return { max: 1, ticks: [0] }

  const rough = max / 4
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * magnitude >= rough) ?? 10) * magnitude
  return { max: step * 4, ticks: [0, 1, 2, 3, 4].map((i) => step * i) }
})

/** Con muchas columnas se muestra solo una de cada N etiquetas para que no se encimen. */
const labelEvery = computed(() => Math.max(1, Math.ceil(props.points.length / 8)))
</script>

<template>
  <div>
    <div class="mb-2 flex justify-end">
      <button
        type="button"
        class="cursor-pointer text-sm text-primary hover:underline"
        @click="showTable = !showTable"
      >
        {{ showTable ? 'Ver como gráfica' : 'Ver como tabla' }}
      </button>
    </div>

    <p v-if="points.length === 0" class="py-12 text-center">Sin datos en este período.</p>

    <!-- Tabla: los mismos datos, accesibles sin gráfica. -->
    <div v-else-if="showTable" class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead>
          <tr class="border-b border-black/10 text-xs text-heading uppercase">
            <th class="py-2 pr-3">Período</th>
            <th class="py-2 pr-3 text-right">{{ seriesLabel }}</th>
            <th
              v-for="detail in points[0]?.details ?? []"
              :key="detail.label"
              class="py-2 pr-3 text-right"
            >
              {{ detail.label }}
            </th>
          </tr>
        </thead>
        <tbody class="tabular-nums">
          <tr v-for="point in points" :key="point.label" class="border-b border-black/5">
            <td class="py-2 pr-3">{{ point.label }}</td>
            <td class="py-2 pr-3 text-right">{{ format(point.value) }}</td>
            <td
              v-for="detail in point.details ?? []"
              :key="detail.label"
              class="py-2 pr-3 text-right"
            >
              {{ detail.value }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Gráfica -->
    <div v-else class="flex gap-3">
      <!-- Eje Y -->
      <div
        class="relative w-16 shrink-0 text-right text-xs tabular-nums"
        :style="{ height: `${height}px` }"
        aria-hidden="true"
      >
        <span
          v-for="tick in scale.ticks"
          :key="tick"
          class="absolute right-0 translate-y-1/2"
          :style="{ bottom: `${(tick / scale.max) * 100}%` }"
        >
          {{ format(tick) }}
        </span>
      </div>

      <div class="min-w-0 flex-1">
        <div class="relative" :style="{ height: `${height}px` }">
          <!-- Líneas de guía -->
          <div
            v-for="tick in scale.ticks"
            :key="tick"
            class="absolute inset-x-0 h-px bg-chart-grid"
            :style="{ bottom: `${(tick / scale.max) * 100}%` }"
            aria-hidden="true"
          />

          <!-- Columnas: cada una es el objetivo del mouse y del teclado. -->
          <div
            class="absolute inset-0 flex items-end gap-0.5"
            role="list"
            :aria-label="seriesLabel"
          >
            <button
              v-for="(point, index) in points"
              :key="point.label"
              type="button"
              role="listitem"
              class="group relative flex h-full flex-1 cursor-default items-end justify-center outline-none"
              :aria-label="`${point.label}: ${format(point.value)}`"
              @mouseenter="active = index"
              @mouseleave="active = null"
              @focus="active = index"
              @blur="active = null"
            >
              <span
                class="w-full max-w-6 rounded-t-[4px] bg-chart transition-opacity group-hover:opacity-80 group-focus-visible:ring-2 group-focus-visible:ring-primary"
                :style="{ height: `${(point.value / scale.max) * 100}%` }"
              />

              <!-- Tooltip: valor primero, luego la etiqueta. -->
              <span
                v-if="active === index"
                class="pointer-events-none absolute bottom-full z-10 mb-2 min-w-36 rounded-md bg-white px-3 py-2 text-left text-xs whitespace-nowrap shadow-card"
                :class="index < points.length / 2 ? 'left-0' : 'right-0'"
              >
                <span class="block text-sm font-semibold text-heading">
                  {{ format(point.value) }}
                </span>
                <span class="block">{{ seriesLabel }} · {{ point.label }}</span>
                <span v-for="detail in point.details ?? []" :key="detail.label" class="block">
                  {{ detail.label }}: <strong class="text-heading">{{ detail.value }}</strong>
                </span>
              </span>
            </button>
          </div>
        </div>

        <!-- Eje X -->
        <div class="mt-2 flex gap-0.5 text-xs" aria-hidden="true">
          <span
            v-for="(point, index) in points"
            :key="point.label"
            class="flex-1 truncate text-center"
          >
            {{ index % labelEvery === 0 ? point.label : '' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
