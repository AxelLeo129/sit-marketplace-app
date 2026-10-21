<script setup lang="ts">
/**
 * Registrar o editar un cliente. Al crear, se puede prellenar con los datos del paciente.
 */
import { watch } from 'vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useForm } from '@/composables/useForm'
import { api } from '@/services/api'
import type { Resource } from '@/types/api'
import type { Customer } from '@/types/order'

const props = defineProps<{
  /** Cliente a editar; null para crear uno nuevo. */
  customer: Customer | null
  /** Datos iniciales al crear (p. ej. nombre y teléfono del paciente). */
  initial?: { name?: string; phone?: string; email?: string | null }
}>()
const emit = defineEmits<{ saved: [customer: Customer] }>()
const open = defineModel<boolean>('open', { required: true })

const form = useForm({ name: '', tax_id: 'CF', phone: '', email: '', birth_date: '' })

watch(open, (isOpen) => {
  if (!isOpen) return

  form.reset()
  const source = props.customer ?? props.initial
  Object.assign(form.data, {
    name: source?.name ?? '',
    phone: source?.phone ?? '',
    email: source?.email ?? '',
    tax_id: props.customer?.tax_id ?? 'CF',
    birth_date: props.customer?.birth_date ?? '',
  })
})

async function save(): Promise<void> {
  const body = {
    ...form.data,
    email: form.data.email || null,
    birth_date: form.data.birth_date || null,
  }
  const response = await form.submit(() =>
    props.customer
      ? api.put<Resource<Customer>>(`/customers/${props.customer.id}`, body)
      : api.post<Resource<Customer>>('/customers', body),
  )

  if (response) {
    open.value = false
    emit('saved', response.data)
  }
}
</script>

<template>
  <BaseModal v-model:open="open" :title="customer ? 'Editar cliente' : 'Nuevo cliente'">
    <form id="customer-form" class="space-y-4" novalidate @submit.prevent="save">
      <BaseAlert v-if="form.message.value" variant="danger">{{ form.message.value }}</BaseAlert>
      <BaseInput v-model="form.data.name" label="Nombre" :error="form.errors.value.name" required />
      <div class="grid gap-4 sm:grid-cols-2">
        <BaseInput
          v-model="form.data.phone"
          label="Teléfono"
          type="tel"
          :error="form.errors.value.phone"
          required
        />
        <BaseInput
          v-model="form.data.tax_id"
          label="NIT (o CF)"
          :error="form.errors.value.tax_id"
          required
        />
        <BaseInput
          v-model="form.data.email"
          label="Correo"
          type="email"
          :error="form.errors.value.email"
        />
        <BaseInput
          v-model="form.data.birth_date"
          label="Fecha de nacimiento"
          type="date"
          :error="form.errors.value.birth_date"
        />
      </div>
    </form>
    <template #footer>
      <BaseButton variant="outline" @click="open = false">Cancelar</BaseButton>
      <BaseButton type="submit" form="customer-form" :loading="form.processing.value">
        Guardar
      </BaseButton>
    </template>
  </BaseModal>
</template>
