<script setup lang="ts">
/**
 * Foto y datos personales del usuario.
 */
import { ref } from 'vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import ImagePicker from '@/components/ImagePicker.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { useForm } from '@/composables/useForm'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { Resource } from '@/types/api'
import type { User } from '@/types/user'

const props = defineProps<{ user: User }>()

const auth = useAuthStore()
const saved = ref(false)

const form = useForm({
  name: props.user.name,
  email: props.user.email,
  phone: props.user.phone ?? '',
  birth_date: props.user.birth_date ?? '',
})
const avatarForm = useForm({})

async function save(): Promise<void> {
  saved.value = false
  const response = await form.submit(() =>
    api.patch<Resource<User>>('/me', {
      ...form.data,
      // Vacío se guarda como "sin dato".
      phone: form.data.phone || null,
      birth_date: form.data.birth_date || null,
    }),
  )

  if (response) {
    auth.setUser(response.data)
    saved.value = true
  }
}

async function uploadAvatar(file: File): Promise<void> {
  const body = new FormData()
  body.append('image', file)

  const response = await avatarForm.submit(() => api.post<Resource<User>>('/me/avatar', body))
  if (response) {
    auth.setUser(response.data)
  }
}
</script>

<template>
  <div class="mb-8 flex flex-wrap items-center gap-5">
    <UserAvatar :name="user.name" :src="user.avatar_url" size="size-20" />
    <div>
      <ImagePicker
        label="Cambiar foto"
        :loading="avatarForm.processing.value"
        @select="uploadAvatar"
      />
      <p
        v-if="avatarForm.errors.value.image || avatarForm.message.value"
        class="text-xs text-danger"
      >
        {{ avatarForm.errors.value.image || avatarForm.message.value }}
      </p>
    </div>
  </div>

  <form class="space-y-5" novalidate @submit.prevent="save">
    <BaseAlert v-if="saved" variant="success">Datos actualizados.</BaseAlert>
    <BaseAlert v-if="form.message.value" variant="danger">{{ form.message.value }}</BaseAlert>

    <div class="grid gap-5 md:grid-cols-2">
      <BaseInput v-model="form.data.name" label="Nombre" :error="form.errors.value.name" required />
      <BaseInput
        v-model="form.data.email"
        label="Correo"
        type="email"
        autocomplete="email"
        :error="form.errors.value.email"
        required
      />
      <BaseInput
        v-model="form.data.phone"
        label="Teléfono"
        type="tel"
        autocomplete="tel"
        :error="form.errors.value.phone"
      />
      <BaseInput
        v-model="form.data.birth_date"
        label="Fecha de nacimiento"
        type="date"
        :error="form.errors.value.birth_date"
      />
    </div>

    <p v-if="user.collegiate_number">
      No. de colegiado: <strong>{{ user.collegiate_number }}</strong>
    </p>

    <BaseButton type="submit" :loading="form.processing.value">Guardar cambios</BaseButton>
  </form>
</template>
