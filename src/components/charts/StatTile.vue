<script setup lang="ts">
/**
 * Indicador con un número (statistics card de Vuexy): ícono, valor y etiqueta.
 * Si recibe `to`, toda la tarjeta es un enlace.
 */
import type { Component } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

defineProps<{
  label: string
  /** Valor ya formateado; null mientras carga. */
  value: string | null
  icon?: Component
  hint?: string
  to?: RouteLocationRaw
}>()
</script>

<template>
  <component
    :is="to ? RouterLink : 'section'"
    :to="to"
    class="flex items-center gap-4 rounded-lg bg-white p-5 shadow-card"
    :class="to ? 'transition-transform hover:-translate-y-0.5' : ''"
  >
    <span
      v-if="icon"
      class="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"
    >
      <component :is="icon" class="size-5" />
    </span>
    <div class="min-w-0">
      <p v-if="value === null" class="mb-1 h-7 w-24 animate-pulse rounded bg-black/10" />
      <p v-else class="truncate text-2xl font-semibold text-heading">{{ value }}</p>
      <p class="text-sm">{{ label }}</p>
      <p v-if="hint" class="text-xs text-content/70">{{ hint }}</p>
    </div>
  </component>
</template>
