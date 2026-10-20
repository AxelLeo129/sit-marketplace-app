<script setup lang="ts">
/**
 * Cambio de contraseña. La API cierra las demás sesiones del usuario.
 */
import { ref } from 'vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useForm } from '@/composables/useForm'
import { api } from '@/services/api'

const form = useForm({ current_password: '', password: '', password_confirmation: '' })
const saved = ref(false)

async function save(): Promise<void> {
  saved.value = false
  const response = await form.submit(() => api.put('/me/password', form.data))

  if (response) {
    form.reset()
    saved.value = true
  }
}
</script>

<template>
  <form class="max-w-md space-y-5" novalidate @submit.prevent="save">
    <BaseAlert v-if="saved" variant="success">
      Contraseña actualizada. Se cerró la sesión en los demás dispositivos.
    </BaseAlert>
    <BaseAlert v-if="form.message.value" variant="danger">{{ form.message.value }}</BaseAlert>

    <BaseInput
      v-model="form.data.current_password"
      label="Contraseña actual"
      type="password"
      autocomplete="current-password"
      :error="form.errors.value.current_password"
      required
    />
    <BaseInput
      v-model="form.data.password"
      label="Contraseña nueva"
      type="password"
      autocomplete="new-password"
      :error="form.errors.value.password"
      required
    />
    <BaseInput
      v-model="form.data.password_confirmation"
      label="Confirmar contraseña nueva"
      type="password"
      autocomplete="new-password"
      required
    />
    <p class="text-xs">Mínimo 8 caracteres, con letras y números.</p>

    <BaseButton type="submit" :loading="form.processing.value">Cambiar contraseña</BaseButton>
  </form>
</template>
