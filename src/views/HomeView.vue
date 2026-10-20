<script setup lang="ts">
/**
 * Página de inicio: saludo al usuario. Cada módulo agregará aquí su resumen.
 */
import { Sparkles } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div v-if="auth.user" class="grid gap-6 lg:grid-cols-2">
    <!-- Tarjeta de bienvenida con el degradado de Vuexy. -->
    <section
      class="bg-primary-gradient relative overflow-hidden rounded-lg p-8 text-center text-white shadow-card"
    >
      <span class="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-white/20">
        <Sparkles class="size-7" />
      </span>
      <h1 class="mb-2 text-2xl text-white">Bienvenido, {{ auth.user.name }}</h1>
      <p class="text-white/90">Has iniciado sesión como {{ auth.user.role_label }}.</p>
    </section>
  </div>
</template>
