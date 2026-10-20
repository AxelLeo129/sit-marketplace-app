<script setup lang="ts">
/**
 * Página completa para login y recuperación de contraseña:
 * tarjeta centrada con la ilustración a la izquierda (como en Vuexy).
 */
import { RouterView } from 'vue-router'
import loginImage from '@/assets/images/login.png'
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4">
    <div
      class="grid w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-card lg:grid-cols-2"
    >
      <div class="hidden items-center justify-center bg-body p-8 lg:flex">
        <img :src="loginImage" alt="" class="mx-auto" />
      </div>
      <div class="p-8 sm:p-12">
        <RouterView />
      </div>
    </div>
  </div>
</template>
