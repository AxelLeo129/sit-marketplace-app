<script setup lang="ts">
/**
 * Tarjeta blanca con sombra suave (vx-card de Vuexy).
 */
defineProps<{ title?: string }>()
</script>

<template>
  <section class="rounded-lg bg-white shadow-card">
    <header v-if="title || $slots.actions" class="flex items-center justify-between px-6 pt-6">
      <h4 class="text-lg">{{ title }}</h4>
      <slot name="actions" />
    </header>
    <div class="p-6">
      <slot />
    </div>
  </section>
</template>
