<script setup lang="ts">
/**
 * Página no encontrada.
 */
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
    <h1 class="text-6xl font-semibold text-primary">404</h1>
    <h2 class="text-xl">Página no encontrada</h2>
    <p>La página que buscas no existe o fue movida.</p>
    <RouterLink
      :to="{ name: 'home' }"
      class="rounded-md bg-primary px-6 py-2.5 font-medium text-white hover:shadow-[0_8px_25px_-8px_var(--color-primary)]"
    >
      Volver al inicio
    </RouterLink>
  </div>
</template>
