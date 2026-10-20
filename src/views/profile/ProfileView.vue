<script setup lang="ts">
/**
 * Mi perfil (account-settings de Vuexy): pestañas a la izquierda y formulario a la derecha.
 */
import { computed, ref } from 'vue'
import { Building2, Lock, User as UserIcon } from 'lucide-vue-next'
import BaseCard from '@/components/ui/BaseCard.vue'
import { useAuthStore } from '@/stores/auth'
import ProfileClinicForm from './components/ProfileClinicForm.vue'
import ProfileGeneralForm from './components/ProfileGeneralForm.vue'
import ProfilePasswordForm from './components/ProfilePasswordForm.vue'

type Tab = 'general' | 'password' | 'clinic'

const auth = useAuthStore()
const activeTab = ref<Tab>('general')

const tabs = computed(() => [
  { id: 'general' as const, label: 'General', icon: UserIcon },
  { id: 'password' as const, label: 'Cambiar contraseña', icon: Lock },
  // Solo los médicos tienen datos de clínica.
  ...(auth.hasRole('doctor')
    ? [{ id: 'clinic' as const, label: 'Mi clínica', icon: Building2 }]
    : []),
])
</script>

<template>
  <h2 class="mb-6 text-2xl">Mi perfil</h2>

  <div v-if="auth.user" class="flex flex-col gap-6 md:flex-row">
    <nav class="md:w-56 md:shrink-0" aria-label="Secciones del perfil">
      <ul class="flex gap-2 overflow-x-auto md:flex-col">
        <li v-for="tab in tabs" :key="tab.id">
          <button
            type="button"
            class="flex w-full cursor-pointer items-center gap-3 rounded-md px-4 py-2.5 whitespace-nowrap transition-colors"
            :class="
              activeTab === tab.id
                ? 'bg-primary-gradient text-white shadow-primary'
                : 'hover:text-primary'
            "
            :aria-current="activeTab === tab.id ? 'page' : undefined"
            @click="activeTab = tab.id"
          >
            <component :is="tab.icon" class="size-4" />
            {{ tab.label }}
          </button>
        </li>
      </ul>
    </nav>

    <BaseCard class="flex-1">
      <ProfileGeneralForm v-if="activeTab === 'general'" :user="auth.user" />
      <ProfilePasswordForm v-else-if="activeTab === 'password'" />
      <ProfileClinicForm v-else :user="auth.user" />
    </BaseCard>
  </div>
</template>
