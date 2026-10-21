<script setup lang="ts">
/**
 * Barra superior flotante con el usuario y su menú (perfil y cerrar sesión).
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { LogOut, Menu, User as UserIcon } from 'lucide-vue-next'
import UserAvatar from '@/components/UserAvatar.vue'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits<{ toggleMenu: [] }>()

const auth = useAuthStore()
const router = useRouter()
const dropdownOpen = ref(false)
const dropdown = ref<HTMLElement | null>(null)

// Cierra el menú del usuario al hacer clic fuera de él.
function closeOnOutsideClick(event: MouseEvent): void {
  if (dropdown.value && !dropdown.value.contains(event.target as Node)) {
    dropdownOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', closeOnOutsideClick))
onBeforeUnmount(() => document.removeEventListener('click', closeOnOutsideClick))

async function logout(): Promise<void> {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <header
    class="sticky top-4 z-20 mx-4 mt-4 flex h-16 items-center justify-between rounded-lg bg-white px-5 shadow-navbar lg:mx-8 lg:mt-5 print:hidden"
  >
    <button
      type="button"
      class="cursor-pointer text-content lg:invisible"
      aria-label="Abrir menú"
      @click="emit('toggleMenu')"
    >
      <Menu class="size-5" />
    </button>

    <div v-if="auth.user" ref="dropdown" class="relative">
      <button
        type="button"
        class="flex cursor-pointer items-center gap-3"
        :aria-expanded="dropdownOpen"
        @click="dropdownOpen = !dropdownOpen"
      >
        <span class="hidden text-right leading-tight sm:block">
          <span class="block font-semibold text-heading">{{ auth.user.name }}</span>
          <small>{{ auth.user.role_label }}</small>
        </span>
        <UserAvatar :name="auth.user.name" :src="auth.user.avatar_url" />
      </button>

      <div
        v-if="dropdownOpen"
        class="absolute right-0 mt-3 w-48 overflow-hidden rounded-md bg-white py-1 shadow-card"
      >
        <RouterLink
          :to="{ name: 'profile' }"
          class="flex items-center gap-2 px-4 py-2 hover:bg-primary/5 hover:text-primary"
          @click="dropdownOpen = false"
        >
          <UserIcon class="size-4" /> Mi perfil
        </RouterLink>
        <button
          type="button"
          class="flex w-full cursor-pointer items-center gap-2 px-4 py-2 hover:bg-danger/5 hover:text-danger"
          @click="logout"
        >
          <LogOut class="size-4" /> Cerrar sesión
        </button>
      </div>
    </div>
  </header>
</template>
