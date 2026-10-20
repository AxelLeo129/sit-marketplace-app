<script setup lang="ts">
/**
 * Casilla de verificación con etiqueta.
 */
defineProps<{ label: string }>()

const model = defineModel<boolean>({ default: false })
</script>

<template>
  <label class="inline-flex cursor-pointer items-center gap-2 select-none">
    <input v-model="model" type="checkbox" class="size-4 cursor-pointer accent-primary" />
    <span>{{ label }}</span>
  </label>
</template>
