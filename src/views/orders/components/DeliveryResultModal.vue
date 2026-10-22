<script setup lang="ts">
/**
 * El mensajero cierra la entrega:
 * - "delivered": con el nombre de quien recibió (y notas opcionales).
 * - "failed": con el motivo, para que el despachador reasigne o el call-center cancele.
 */
import { watch } from 'vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import { useForm } from '@/composables/useForm'
import { api } from '@/services/api'
import type { Resource } from '@/types/api'
import type { Order } from '@/types/order'

const props = defineProps<{ order: Order; result: 'delivered' | 'failed' }>()
const emit = defineEmits<{ saved: [order: Order] }>()
const open = defineModel<boolean>('open', { required: true })

const form = useForm({ received_by: '', notes: '' })

watch(open, (isOpen) => isOpen && form.reset())

async function save(): Promise<void> {
  const response = await form.submit(() =>
    props.result === 'delivered'
      ? api.post<Resource<Order>>(`/orders/${props.order.id}/deliver`, {
          received_by: form.data.received_by,
          notes: form.data.notes || null,
        })
      : api.post<Resource<Order>>(`/orders/${props.order.id}/fail-delivery`, {
          notes: form.data.notes,
        }),
  )

  if (response) {
    open.value = false
    emit('saved', response.data)
  }
}
</script>

<template>
  <BaseModal
    v-model:open="open"
    :title="result === 'delivered' ? 'Confirmar entrega' : 'No se pudo entregar'"
  >
    <form id="delivery-form" class="space-y-4" novalidate @submit.prevent="save">
      <BaseAlert v-if="form.message.value" variant="danger">{{ form.message.value }}</BaseAlert>
      <BaseInput
        v-if="result === 'delivered'"
        v-model="form.data.received_by"
        label="Nombre de quien recibe"
        :error="form.errors.value.received_by"
        required
      />
      <BaseTextarea
        v-model="form.data.notes"
        :label="result === 'delivered' ? 'Observaciones (opcional)' : 'Motivo'"
        :error="form.errors.value.notes"
      />
    </form>
    <template #footer>
      <BaseButton variant="outline" @click="open = false">Cancelar</BaseButton>
      <BaseButton
        type="submit"
        form="delivery-form"
        :variant="result === 'delivered' ? 'success' : 'danger'"
        :loading="form.processing.value"
      >
        {{ result === 'delivered' ? 'Confirmar entrega' : 'Reportar' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
