<script setup lang="ts">
/**
 * El médico emite una receta o corrige una que el call-center aún no procesó.
 * Sin `id` crea una nueva; con `id`, la edita.
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Trash2 } from 'lucide-vue-next'
import ProductSearch from '@/components/ProductSearch.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import { useForm } from '@/composables/useForm'
import { api } from '@/services/api'
import { useToastStore } from '@/stores/toast'
import type { Resource } from '@/types/api'
import type { Product } from '@/types/catalog'
import type { Prescription } from '@/types/prescription'

const props = defineProps<{ id?: string }>()

const router = useRouter()
const toast = useToastStore()
const loading = ref(Boolean(props.id))

const form = useForm({
  patient_name: '',
  patient_phone: '',
  patient_email: '',
  symptoms: '',
  diagnosis: '',
  observations: '',
  next_appointment_on: '',
  allows_call_center: true,
})

/** Medicamentos recetados, con sus indicaciones. */
const items = ref<{ product: Product; dosage_instructions: string }[]>([])
const selectedIds = computed(() => items.value.map((item) => item.product.id))

// La próxima cita debe ser después de hoy.
const tomorrow = new Date(Date.now() + 86_400_000).toLocaleDateString('en-CA', {
  timeZone: 'America/Guatemala',
})

onMounted(async () => {
  if (!props.id) return

  const { data } = await api.get<Resource<Prescription>>(`/prescriptions/${props.id}`)
  if (!data.can.update) {
    toast.error('Esta receta ya no se puede editar.')
    await router.replace({ name: 'prescription', params: { id: data.id } })
    return
  }

  Object.assign(form.data, {
    patient_name: data.patient_name,
    patient_phone: data.patient_phone,
    patient_email: data.patient_email ?? '',
    symptoms: data.symptoms ?? '',
    diagnosis: data.diagnosis ?? '',
    observations: data.observations ?? '',
    next_appointment_on: data.next_appointment_on ?? '',
    allows_call_center: data.allows_call_center,
  })
  items.value = data.items.map((item) => ({
    product: item.product,
    dosage_instructions: item.dosage_instructions,
  }))
  loading.value = false
})

function addProduct(product: Product): void {
  items.value.push({ product, dosage_instructions: '' })
}

function removeItem(index: number): void {
  items.value.splice(index, 1)
}

async function save(): Promise<void> {
  const body = {
    ...form.data,
    // Vacío se guarda como "sin dato".
    patient_email: form.data.patient_email || null,
    next_appointment_on: form.data.next_appointment_on || null,
    items: items.value.map((item) => ({
      product_id: item.product.id,
      dosage_instructions: item.dosage_instructions,
    })),
  }

  const response = await form.submit(() =>
    props.id
      ? api.put<Resource<Prescription>>(`/prescriptions/${props.id}`, body)
      : api.post<Resource<Prescription>>('/prescriptions', body),
  )

  if (response) {
    toast.success(props.id ? 'Receta actualizada.' : 'Receta emitida.')
    await router.push({ name: 'prescription', params: { id: response.data.id } })
  }
}
</script>

<template>
  <h2 class="mb-6 text-2xl">{{ id ? `Editar receta No. ${id}` : 'Nueva receta' }}</h2>

  <div v-if="loading" class="h-64 animate-pulse rounded-lg bg-white shadow-card" />

  <form v-else class="space-y-6" novalidate @submit.prevent="save">
    <BaseAlert v-if="form.message.value" variant="danger">{{ form.message.value }}</BaseAlert>

    <BaseCard title="Paciente">
      <div class="grid gap-4 md:grid-cols-3">
        <BaseInput
          v-model="form.data.patient_name"
          label="Nombre"
          :error="form.errors.value.patient_name"
          required
        />
        <BaseInput
          v-model="form.data.patient_phone"
          label="Teléfono"
          type="tel"
          :error="form.errors.value.patient_phone"
          required
        />
        <BaseInput
          v-model="form.data.patient_email"
          label="Correo"
          type="email"
          :error="form.errors.value.patient_email"
        />
      </div>
    </BaseCard>

    <BaseCard title="Consulta">
      <p class="mb-4 text-sm">
        Estos datos solo los ves tú: no se imprimen, no se envían al paciente y el call-center no
        los ve.
      </p>
      <div class="grid gap-4 md:grid-cols-2">
        <BaseTextarea
          v-model="form.data.symptoms"
          label="Síntomas"
          :error="form.errors.value.symptoms"
        />
        <BaseTextarea
          v-model="form.data.diagnosis"
          label="Diagnóstico"
          :error="form.errors.value.diagnosis"
        />
        <BaseTextarea
          v-model="form.data.observations"
          label="Observaciones"
          class="md:col-span-2"
          :error="form.errors.value.observations"
        />
        <BaseInput
          v-model="form.data.next_appointment_on"
          label="Próxima cita"
          type="date"
          :min="tomorrow"
          :error="form.errors.value.next_appointment_on"
        />
      </div>
    </BaseCard>

    <BaseCard title="Medicamentos">
      <ProductSearch
        :exclude-ids="selectedIds"
        :error="form.errors.value.items"
        class="mb-4"
        @select="addProduct"
      />

      <p v-if="items.length === 0" class="py-6 text-center">
        Busca y agrega los medicamentos de la receta.
      </p>

      <ul class="space-y-3">
        <li
          v-for="(item, index) in items"
          :key="item.product.id"
          class="grid items-start gap-3 rounded-md border border-black/10 p-4 md:grid-cols-[1fr_1.5fr_auto]"
        >
          <div>
            <p class="font-medium text-heading">{{ item.product.name }}</p>
            <p class="text-xs">
              {{ item.product.presentation.label }} · {{ item.product.lab.name }}
            </p>
            <p v-if="form.errors.value[`items.${index}.product_id`]" class="text-xs text-danger">
              {{ form.errors.value[`items.${index}.product_id`] }}
            </p>
          </div>
          <BaseInput
            v-model="item.dosage_instructions"
            placeholder="Indicaciones, p. ej. 1 tableta cada 8 horas por 5 días"
            :error="form.errors.value[`items.${index}.dosage_instructions`]"
            required
          />
          <button
            type="button"
            class="cursor-pointer self-center p-1 hover:text-danger"
            :aria-label="`Quitar ${item.product.name}`"
            @click="removeItem(index)"
          >
            <Trash2 class="size-4" />
          </button>
        </li>
      </ul>
    </BaseCard>

    <BaseCard>
      <BaseCheckbox
        v-model="form.data.allows_call_center"
        label="El call-center puede llamar al paciente para ofrecerle el pedido"
      />
    </BaseCard>

    <div class="flex justify-end gap-3">
      <BaseButton variant="outline" @click="router.back()">Cancelar</BaseButton>
      <BaseButton type="submit" :loading="form.processing.value">
        {{ id ? 'Guardar cambios' : 'Emitir receta' }}
      </BaseButton>
    </div>
  </form>
</template>
