<script setup lang="ts">
/**
 * Datos de la clínica del médico (se imprimen en sus recetas) y sus especialidades.
 */
import { onMounted, ref } from 'vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import ImagePicker from '@/components/ImagePicker.vue'
import { useForm } from '@/composables/useForm'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import type { Collection, Resource } from '@/types/api'
import type { Category, User } from '@/types/user'

const props = defineProps<{ user: User }>()

const auth = useAuthStore()
const profile = props.user.doctor_profile
const categories = ref<Category[]>([])
const saved = ref(false)

const form = useForm({
  clinic_name: profile?.clinic_name ?? '',
  clinic_phone: profile?.clinic_phone ?? '',
  clinic_address: profile?.clinic_address ?? '',
  keeps_clinical_record: profile?.keeps_clinical_record ?? false,
  show_alerts: profile?.show_alerts ?? false,
})
const specialtyIds = ref<number[]>(props.user.specialties?.map((category) => category.id) ?? [])
const logoForm = useForm({})

onMounted(async () => {
  categories.value = (await api.get<Collection<Category>>('/categories')).data
})

async function save(): Promise<void> {
  saved.value = false
  const response = await form.submit(() =>
    api.patch<Resource<User>>('/me', {
      doctor_profile: form.data,
      category_ids: specialtyIds.value,
    }),
  )

  if (response) {
    auth.setUser(response.data)
    saved.value = true
  }
}

async function uploadLogo(file: File): Promise<void> {
  const body = new FormData()
  body.append('image', file)

  const response = await logoForm.submit(() => api.post<Resource<User>>('/me/clinic-logo', body))
  if (response) {
    auth.setUser(response.data)
  }
}
</script>

<template>
  <div class="mb-8 flex flex-wrap items-center gap-5">
    <img
      v-if="user.doctor_profile?.clinic_logo_url"
      :src="user.doctor_profile.clinic_logo_url"
      alt="Logo de la clínica"
      class="h-20 w-auto rounded-md object-contain"
    />
    <div>
      <ImagePicker label="Subir logo" :loading="logoForm.processing.value" @select="uploadLogo" />
      <p v-if="logoForm.errors.value.image || logoForm.message.value" class="text-xs text-danger">
        {{ logoForm.errors.value.image || logoForm.message.value }}
      </p>
    </div>
  </div>

  <form class="space-y-5" novalidate @submit.prevent="save">
    <BaseAlert v-if="saved" variant="success">Datos de la clínica actualizados.</BaseAlert>
    <BaseAlert v-if="form.message.value" variant="danger">{{ form.message.value }}</BaseAlert>

    <div class="grid gap-5 md:grid-cols-2">
      <BaseInput
        v-model="form.data.clinic_name"
        label="Nombre de la clínica"
        :error="form.errors.value['doctor_profile.clinic_name']"
      />
      <BaseInput
        v-model="form.data.clinic_phone"
        label="Teléfono de la clínica"
        type="tel"
        :error="form.errors.value['doctor_profile.clinic_phone']"
      />
      <BaseInput
        v-model="form.data.clinic_address"
        label="Dirección de la clínica"
        class="md:col-span-2"
        :error="form.errors.value['doctor_profile.clinic_address']"
      />
    </div>

    <div class="flex flex-col gap-3">
      <BaseCheckbox v-model="form.data.keeps_clinical_record" label="Llevo expediente clínico" />
      <BaseCheckbox v-model="form.data.show_alerts" label="Mostrar alertas" />
    </div>

    <fieldset>
      <legend class="mb-2 font-medium text-heading">Especialidades</legend>
      <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <label
          v-for="category in categories"
          :key="category.id"
          class="inline-flex cursor-pointer items-center gap-2"
        >
          <input
            v-model="specialtyIds"
            type="checkbox"
            :value="category.id"
            class="size-4 cursor-pointer accent-primary"
          />
          {{ category.name }}
        </label>
      </div>
      <p v-if="form.errors.value.category_ids" class="mt-1 text-xs text-danger">
        {{ form.errors.value.category_ids }}
      </p>
    </fieldset>

    <BaseButton type="submit" :loading="form.processing.value">Guardar cambios</BaseButton>
  </form>
</template>
