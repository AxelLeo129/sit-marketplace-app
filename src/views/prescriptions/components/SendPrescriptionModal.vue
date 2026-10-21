<script setup lang="ts">
/**
 * El médico envía la receta al correo del paciente (sin síntomas ni diagnóstico).
 * Si escribe otro correo, la API lo guarda como el del paciente.
 */
import { watch } from 'vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useForm } from '@/composables/useForm'
import { api } from '@/services/api'
import { useToastStore } from '@/stores/toast'
import type { Prescription } from '@/types/prescription'

const props = defineProps<{ prescription: Prescription }>()
const emit = defineEmits<{ sent: [email: string] }>()
const open = defineModel<boolean>('open', { required: true })

const toast = useToastStore()
const form = useForm({ email: '' })

watch(open, (isOpen) => {
  if (!isOpen) return
  form.reset()
  form.data.email = props.prescription.patient_email ?? ''
})

async function send(): Promise<void> {
  const response = await form.submit(() =>
    api.post<{ message: string }>(`/prescriptions/${props.prescription.id}/send`, form.data),
  )

  if (response) {
    open.value = false
    toast.success(response.message)
    emit('sent', form.data.email)
  }
}
</script>

<template>
  <BaseModal v-model:open="open" title="Enviar receta por correo">
    <form id="send-form" class="space-y-4" novalidate @submit.prevent="send">
      <BaseAlert v-if="form.message.value" variant="danger">{{ form.message.value }}</BaseAlert>
      <BaseInput
        v-model="form.data.email"
        label="Correo del paciente"
        type="email"
        :error="form.errors.value.email"
        required
      />
      <p class="text-xs">
        El correo incluye los medicamentos y las indicaciones, no el diagnóstico.
      </p>
    </form>
    <template #footer>
      <BaseButton variant="outline" @click="open = false">Cancelar</BaseButton>
      <BaseButton type="submit" form="send-form" :loading="form.processing.value"
        >Enviar</BaseButton
      >
    </template>
  </BaseModal>
</template>
