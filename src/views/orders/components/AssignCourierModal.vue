<script setup lang="ts">
/**
 * El despachador asigna (o reasigna) el mensajero. Muestra cuántas entregas
 * pendientes tiene cada uno para repartir la carga.
 */
import { ref, watch } from 'vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useForm } from '@/composables/useForm'
import { api } from '@/services/api'
import type { Collection, Resource } from '@/types/api'
import type { Order } from '@/types/order'

interface Courier {
  id: number
  name: string
  phone: string | null
  pending_deliveries_count: number
}

const props = defineProps<{ order: Order }>()
const emit = defineEmits<{ saved: [order: Order] }>()
const open = defineModel<boolean>('open', { required: true })

const couriers = ref<Courier[] | null>(null)
const form = useForm({ courier_id: null as number | null })

watch(open, async (isOpen) => {
  if (!isOpen) return
  form.reset()
  form.data.courier_id = props.order.delivery.courier?.id ?? null
  couriers.value = null
  couriers.value = (await api.get<Collection<Courier>>('/couriers')).data
})

async function save(): Promise<void> {
  const response = await form.submit(() =>
    api.post<Resource<Order>>(`/orders/${props.order.id}/assign`, form.data),
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
    :title="order.delivery.courier ? 'Reasignar mensajero' : 'Asignar mensajero'"
  >
    <form id="assign-form" class="space-y-3" novalidate @submit.prevent="save">
      <BaseAlert v-if="form.message.value" variant="danger">{{ form.message.value }}</BaseAlert>
      <p class="text-sm">Entrega en: {{ order.shipping_address.full_address }}</p>

      <div v-if="!couriers" class="space-y-2" aria-busy="true">
        <div v-for="n in 3" :key="n" class="h-14 animate-pulse rounded-md bg-black/5" />
      </div>
      <p v-else-if="couriers.length === 0">No hay mensajeros activos.</p>
      <label
        v-for="courier in couriers"
        v-else
        :key="courier.id"
        class="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-black/10 p-3 has-checked:border-primary has-checked:bg-primary/5"
      >
        <span class="flex items-center gap-3">
          <input
            v-model="form.data.courier_id"
            type="radio"
            :value="courier.id"
            class="accent-primary"
          />
          <span>
            <span class="block font-medium text-heading">{{ courier.name }}</span>
            <span v-if="courier.phone" class="text-xs">Tel. {{ courier.phone }}</span>
          </span>
        </span>
        <span class="text-sm whitespace-nowrap">
          {{ courier.pending_deliveries_count }} pendiente(s)
        </span>
      </label>
      <p v-if="form.errors.value.courier_id" class="text-xs text-danger">
        {{ form.errors.value.courier_id }}
      </p>
    </form>
    <template #footer>
      <BaseButton variant="outline" @click="open = false">Cancelar</BaseButton>
      <BaseButton
        type="submit"
        form="assign-form"
        :loading="form.processing.value"
        :disabled="!form.data.courier_id"
      >
        Asignar
      </BaseButton>
    </template>
  </BaseModal>
</template>
