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

    <div class="flex min-h-screen flex-col lg:ml-[260px] print:ml-0">
      <AppNavbar @toggle-menu="menuOpen = !menuOpen" />

      <main class="flex-1 px-4 py-6 lg:px-8 print:p-0">
        <!-- La key monta la página de nuevo al cambiar de ruta, aunque use el mismo
             componente (p. ej. de "Editar receta" a "Nueva receta"), para no arrastrar datos. -->
        <RouterView :key="$route.path" />
      </main>

      <footer class="px-4 pb-5 text-sm lg:px-8 print:hidden">
        COPYRIGHT © {{ year }} SIT Marketplace
      </footer>
    </div>
  </div>
</template>
