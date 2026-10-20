<script setup lang="ts">
/**
 * Menú lateral (vertical-nav-menu de Vuexy) con las opciones del rol del usuario.
 * En pantallas pequeñas se abre sobre el contenido.
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { X } from 'lucide-vue-next'
import AppLogo from '@/components/AppLogo.vue'
import { navigationFor } from '@/config/navigation'
import { useAuthStore } from '@/stores/auth'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const auth = useAuthStore()
const sections = computed(() => (auth.user ? navigationFor(auth.user.role) : []))
</script>

<template>
  <!-- Fondo oscuro detrás del menú en móvil. -->
  <div
    v-if="open"
    class="fixed inset-0 z-30 bg-black/40 lg:hidden"
    aria-hidden="true"
    @click="emit('close')"
  />

  <aside
    class="fixed inset-y-0 left-0 z-40 w-[260px] bg-white shadow-[0_0_15px_0_rgb(0_0_0/0.05)] transition-transform duration-300 lg:translate-x-0"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
    aria-label="Menú principal"
  >
    <div class="flex h-20 items-center justify-between px-5">
      <RouterLink :to="{ name: 'home' }" @click="emit('close')">
        <AppLogo />
      </RouterLink>
      <button
        type="button"
        class="cursor-pointer text-content lg:hidden"
        aria-label="Cerrar menú"
        @click="emit('close')"
      >
        <X class="size-5" />
      </button>
    </div>

    <nav class="h-[calc(100%-5rem)] overflow-y-auto pb-6">
      <template v-for="(section, index) in sections" :key="index">
        <p
          v-if="section.title"
          class="mt-5 mb-2 px-7 text-xs font-semibold tracking-wider text-content/60 uppercase"
        >
          {{ section.title }}
        </p>
        <ul>
          <li v-for="item in section.items" :key="item.label" class="mx-4 my-0.5">
            <RouterLink
              :to="item.to"
              class="flex items-center gap-3 rounded px-4 py-2.5 transition-all duration-200 hover:translate-x-1"
              active-class="bg-primary-gradient text-white shadow-primary hover:translate-x-0"
              @click="emit('close')"
            >
              <component :is="item.icon" class="size-4" />
              <span>{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>
      </template>
    </nav>
  </aside>
</template>
