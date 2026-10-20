<script setup lang="ts">
/**
 * Estructura de las páginas internas: menú lateral, barra superior, contenido y pie.
 */
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import AppNavbar from './components/AppNavbar.vue'
import SidebarNav from './components/SidebarNav.vue'

const menuOpen = ref(false)
const year = new Date().getFullYear()
</script>

<template>
  <div class="min-h-screen">
    <SidebarNav :open="menuOpen" @close="menuOpen = false" />

    <div class="flex min-h-screen flex-col lg:ml-[260px]">
      <AppNavbar @toggle-menu="menuOpen = !menuOpen" />

      <main class="flex-1 px-4 py-6 lg:px-8">
        <RouterView />
      </main>

      <footer class="px-4 pb-5 text-sm lg:px-8">COPYRIGHT © {{ year }} SIT Marketplace</footer>
    </div>
  </div>
</template>
