<script setup lang="ts">
/**
 * Facturación registra la factura del pedido. NIT y fecha son opcionales:
 * por defecto, el NIT del cliente y la fecha de hoy.
 */
import { watch } from 'vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useForm } from '@/composables/useForm'
import { api } from '@/services/api'
import type { Resource } from '@/types/api'
import type { Order } from '@/types/order'
import { formatMoney } from '@/utils/format'

const props = defineProps<{ order: Order }>()
const emit = defineEmits<{ saved: [order: Order] }>()
const open = defineModel<boolean>('open', { required: true })

const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Guatemala' })
const form = useForm({ invoice_number: '', invoice_tax_id: '', invoiced_at: '' })

watch(open, (isOpen) => {
  if (!isOpen) return
  form.reset()
  form.data.invoice_tax_id = props.order.customer.tax_id
  form.data.invoiced_at = today
})

async function save(): Promise<void> {
  const response = await form.submit(() =>
    api.post<Resource<Order>>(`/orders/${props.order.id}/invoice`, {
      invoice_number: form.data.invoice_number,
      invoice_tax_id: form.data.invoice_tax_id || null,
      // Si es hoy, la API guarda la hora exacta; solo se envía una fecha anterior.
      invoiced_at:
        form.data.invoiced_at && form.data.invoiced_at !== today ? form.data.invoiced_at : null,
    }),
  )

  if (response) {
    open.value = false
    emit('saved', response.data)
  }
}
</script>

<template>
  <BaseModal v-model:open="open" title="Registrar factura">
    <form id="invoice-form" class="space-y-4" novalidate @submit.prevent="save">
      <BaseAlert v-if="form.message.value" variant="danger">{{ form.message.value }}</BaseAlert>
      <p>
        Pedido No. {{ order.id }} · {{ order.customer.name }} ·
        <strong>{{ formatMoney(order.total) }}</strong>
      </p>
      <BaseInput
        v-model="form.data.invoice_number"
        label="No. de factura"
        :error="form.errors.value.invoice_number"
        required
      />
      <div class="grid gap-4 sm:grid-cols-2">
        <BaseInput
          v-model="form.data.invoice_tax_id"
          label="NIT (o CF)"
          :error="form.errors.value.invoice_tax_id"
        />
        <BaseInput
          v-model="form.data.invoiced_at"
          label="Fecha de la factura"
          type="date"
          :max="today"
          :error="form.errors.value.invoiced_at"
        />
      </div>
    </form>
    <template #footer>
      <BaseButton variant="outline" @click="open = false">Cancelar</BaseButton>
      <BaseButton type="submit" form="invoice-form" :loading="form.processing.value">
        Facturar
      </BaseButton>
    </template>
  </BaseModal>
</template>
