<script setup lang="ts">
/**
 * El call-center agenda una nueva llamada con el paciente.
 */
import { watch } from 'vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useForm } from '@/composables/useForm'
import { api } from '@/services/api'
import type { Resource } from '@/types/api'
import type { Prescription } from '@/types/prescription'

const props = defineProps<{ prescription: Prescription }>()
const emit = defineEmits<{ saved: [prescription: Prescription] }>()
const open = defineModel<boolean>('open', { required: true })

const form = useForm({ callback_at: '' })

watch(open, (isOpen) => isOpen && form.reset())

async function save(): Promise<void> {
  // datetime-local no lleva zona horaria: la API la interpreta en hora de Guatemala.
  const response = await form.submit(() =>
    api.post<Resource<Prescription>>(
      `/prescriptions/${props.prescription.id}/reschedule`,
      form.data,
    ),
  )

  if (response) {
    open.value = false
    emit('saved', response.data)
  }
}
</script>

<template>
  <BaseModal v-model:open="open" title="Reagendar llamada">
    <form id="reschedule-form" class="space-y-4" novalidate @submit.prevent="save">
      <BaseAlert v-if="form.message.value" variant="danger">{{ form.message.value }}</BaseAlert>
      <p>¿Cuándo volver a llamar a {{ prescription.patient_name }}?</p>
      <BaseInput
        v-model="form.data.callback_at"
        label="Fecha y hora"
        type="datetime-local"
        :error="form.errors.value.callback_at"
        required
      />
    </form>
    <template #footer>
      <BaseButton variant="outline" @click="open = false">Cancelar</BaseButton>
      <BaseButton type="submit" form="reschedule-form" :loading="form.processing.value">
        Reagendar
      </BaseButton>
    </template>
  </BaseModal>
</template>
