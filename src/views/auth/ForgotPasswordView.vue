<script setup lang="ts">
/**
 * Solicita el enlace para restablecer la contraseña.
 */
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Mail } from 'lucide-vue-next'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useForm } from '@/composables/useForm'
import { api } from '@/services/api'

const form = useForm({ email: '' })
const sentMessage = ref('')

async function submit(): Promise<void> {
  const response = await form.submit(() =>
    api.post<{ message: string }>('/forgot-password', form.data),
  )

  if (response) {
    sentMessage.value = response.message
  }
}
</script>

<template>
  <div class="mb-8">
    <h4 class="mb-1 text-xl">¿Olvidó su contraseña?</h4>
    <p>Ingrese su correo y le enviaremos un enlace para crear una nueva.</p>
  </div>

  <BaseAlert v-if="sentMessage" variant="success" class="mb-6">{{ sentMessage }}</BaseAlert>

  <form v-else class="space-y-5" novalidate @submit.prevent="submit">
    <BaseAlert v-if="form.message.value" variant="danger">{{ form.message.value }}</BaseAlert>

    <BaseInput
      v-model="form.data.email"
      label="Correo"
      type="email"
      :icon="Mail"
      autocomplete="email"
      :error="form.errors.value.email"
      required
    />
    <BaseButton type="submit" block :loading="form.processing.value">Enviar enlace</BaseButton>
  </form>

  <RouterLink :to="{ name: 'login' }" class="mt-6 inline-block text-primary hover:underline">
    Volver a iniciar sesión
  </RouterLink>
</template>
