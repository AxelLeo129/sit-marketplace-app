<script setup lang="ts">
/**
 * Inicio de sesión con número de colegiado o correo.
 */
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Lock, User } from 'lucide-vue-next'
import AppLogo from '@/components/AppLogo.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useForm } from '@/composables/useForm'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const form = useForm({ login: '', password: '' })

/** Solo redirige a rutas internas, para no enviar al usuario a otro sitio. */
function redirectTarget(): string {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect
    : '/'
}

async function submit(): Promise<void> {
  await form.submit(async () => {
    await auth.login(form.data.login, form.data.password)
    await router.replace(redirectTarget())
  })

  form.data.password = ''
}
</script>

<template>
  <div class="mb-8 text-center">
    <AppLogo class="mb-6" />
    <h4 class="mb-1 text-xl">Ingresar</h4>
    <p>Bienvenido de nuevo, inicie sesión en su cuenta.</p>
  </div>

  <form class="space-y-5" novalidate @submit.prevent="submit">
    <BaseAlert v-if="form.message.value" variant="danger">{{ form.message.value }}</BaseAlert>

    <BaseInput
      v-model="form.data.login"
      label="No. de colegiado o correo"
      :icon="User"
      autocomplete="username"
      :error="form.errors.value.login"
      required
    />
    <BaseInput
      v-model="form.data.password"
      label="Contraseña"
      type="password"
      :icon="Lock"
      autocomplete="current-password"
      :error="form.errors.value.password"
      required
    />

    <div class="flex items-center justify-between">
      <RouterLink :to="{ name: 'forgot-password' }" class="text-primary hover:underline">
        ¿Olvidó su contraseña?
      </RouterLink>
      <BaseButton type="submit" :loading="form.processing.value">Ingresar</BaseButton>
    </div>
  </form>
</template>
