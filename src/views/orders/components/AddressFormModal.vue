<script setup lang="ts">
/**
 * Agregar una dirección de facturación o de entrega a un cliente.
 */
import { watch } from 'vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useForm } from '@/composables/useForm'
import { api } from '@/services/api'
import type { Resource } from '@/types/api'
import type { AddressType, CustomerAddress } from '@/types/order'

const props = defineProps<{ customerId: number; type: AddressType }>()
const emit = defineEmits<{ saved: [address: CustomerAddress] }>()
const open = defineModel<boolean>('open', { required: true })

const form = useForm({
  country: 'Guatemala',
  department: '',
  municipality: '',
  street: '',
  apartment: '',
  neighborhood: '',
  postal_code: '',
  phone: '',
})

watch(open, (isOpen) => isOpen && form.reset())

async function save(): Promise<void> {
  // Los campos opcionales vacíos se guardan como "sin dato".
  const body = Object.fromEntries(
    Object.entries({ ...form.data, type: props.type }).map(([key, value]) => [key, value || null]),
  )
  const response = await form.submit(() =>
    api.post<Resource<CustomerAddress>>(`/customers/${props.customerId}/addresses`, body),
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
    :title="type === 'billing' ? 'Nueva dirección de facturación' : 'Nueva dirección de entrega'"
  >
    <form id="address-form" class="space-y-4" novalidate @submit.prevent="save">
      <BaseAlert v-if="form.message.value" variant="danger">{{ form.message.value }}</BaseAlert>
      <div class="grid gap-4 sm:grid-cols-2">
        <BaseInput
          v-model="form.data.department"
          label="Departamento"
          :error="form.errors.value.department"
          required
        />
        <BaseInput
          v-model="form.data.municipality"
          label="Municipio"
          :error="form.errors.value.municipality"
          required
        />
        <BaseInput
          v-model="form.data.street"
          label="Calle y número"
          placeholder="5a calle 3-20 zona 1"
          class="sm:col-span-2"
          :error="form.errors.value.street"
          required
        />
        <BaseInput
          v-model="form.data.apartment"
          label="Apartamento, casa u oficina"
          :error="form.errors.value.apartment"
        />
        <BaseInput
          v-model="form.data.neighborhood"
          label="Colonia o residencial"
          :error="form.errors.value.neighborhood"
        />
        <BaseInput
          v-model="form.data.postal_code"
          label="Código postal"
          :error="form.errors.value.postal_code"
        />
        <BaseInput
          v-model="form.data.phone"
          label="Teléfono de contacto"
          type="tel"
          :error="form.errors.value.phone"
        />
      </div>
    </form>
    <template #footer>
      <BaseButton variant="outline" @click="open = false">Cancelar</BaseButton>
      <BaseButton type="submit" form="address-form" :loading="form.processing.value">
        Guardar
      </BaseButton>
    </template>
  </BaseModal>
</template>
