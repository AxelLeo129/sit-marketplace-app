<script setup lang="ts">
/**
 * Crea una contraseña nueva desde el enlace enviado por correo
 * (la URL trae `token` y `email`).
 */
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Lock } from 'lucide-vue-next'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useForm } from '@/composables/useForm'
import { api } from '@/services/api'

const route = useRoute()
const token = typeof route.query.token === 'string' ? route.query.token : ''
const email = typeof route.query.email === 'string' ? route.query.email : ''

const form = useForm({ password: '', password_confirmation: '' })
const doneMessage = ref('')

async function submit(): Promise<void> {
  const response = await form.submit(() =>
    api.post<{ message: string }>('/reset-password', { token, email, ...form.data }),
  )

  if (response) {
    doneMessage.value = response.message
  }
}
</script>

<template>
  <div class="mb-8">
    <h4 class="mb-1 text-xl">Nueva contraseña</h4>
    <p v-if="email">Para {{ email }}</p>
  </div>

  <BaseAlert v-if="!token || !email" variant="danger">
    El enlace no es válido. Solicite uno nuevo.
  </BaseAlert>

  <BaseAlert v-else-if="doneMessage" variant="success">{{ doneMessage }}</BaseAlert>

  <form v-else class="space-y-5" novalidate @submit.prevent="submit">
    <!-- Token vencido o correo incorrecto: la API lo reporta en "email". -->
    <BaseAlert v-if="form.message.value || form.errors.value.email" variant="danger">
      {{ form.message.value || form.errors.value.email }}
    </BaseAlert>

    <BaseInput
      v-model="form.data.password"
      label="Contraseña"
      type="password"
      :icon="Lock"
      autocomplete="new-password"
      :error="form.errors.value.password"
      required
    />
    <BaseInput
      v-model="form.data.password_confirmation"
      label="Confirmar contraseña"
      type="password"
      :icon="Lock"
      autocomplete="new-password"
      required
    />
    <p class="text-xs">Mínimo 8 caracteres, con letras y números.</p>
    <BaseButton type="submit" block :loading="form.processing.value">Guardar contraseña</BaseButton>
  </form>

  <RouterLink :to="{ name: 'login' }" class="mt-6 inline-block text-primary hover:underline">
    Ir a iniciar sesión
  </RouterLink>
</template>
