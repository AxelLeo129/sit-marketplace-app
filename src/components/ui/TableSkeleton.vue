<script setup lang="ts">
/**
 * Filas de relleno animadas mientras carga una tabla por primera vez.
 * Se pone dentro del <tbody> de una .data-table.
 */
withDefaults(defineProps<{ columns: number; rows?: number }>(), { rows: 5 })
</script>

<template>
  <tr v-for="row in rows" :key="row" aria-hidden="true">
    <td v-for="column in columns" :key="column">
      <div
        class="h-4 animate-pulse rounded bg-black/10"
        :class="column === 1 ? 'w-3/4' : 'w-1/2'"
      />
    </td>
  </tr>
</template>
