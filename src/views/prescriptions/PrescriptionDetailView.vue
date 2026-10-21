<script setup lang="ts">
/**
 * Detalle de una receta con formato para imprimir (invoice de Vuexy).
 *
 * - Médico autor: editar (si sigue abierta), enviar por correo e imprimir.
 * - Call-center: reagendar la llamada o cancelar.
 * Los botones salen del bloque `can` que manda la API.
 */
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  ArrowLeft,
  CalendarClock,
  Mail,
  Pencil,
  Printer,
  ShoppingCart,
  XCircle,
} from 'lucide-vue-next'
import ConfirmModal from '@/components/ConfirmModal.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import { api, ApiError } from '@/services/api'
import { useToastStore } from '@/stores/toast'
import type { Resource } from '@/types/api'
import { prescriptionStatusVariants, type Prescription } from '@/types/prescription'
import { formatDate, formatDateTime } from '@/utils/format'
import RescheduleModal from './components/RescheduleModal.vue'
import SendPrescriptionModal from './components/SendPrescriptionModal.vue'

const props = defineProps<{ id: string }>()

const router = useRouter()
const toast = useToastStore()
const prescription = ref<Prescription | null>(null)

const rescheduleOpen = ref(false)
const sendOpen = ref(false)
const cancelOpen = ref(false)
const cancelling = ref(false)

onMounted(async () => {
  try {
    prescription.value = (await api.get<Resource<Prescription>>(`/prescriptions/${props.id}`)).data
  } catch (error) {
    toast.error(error instanceof ApiError ? error.message : 'No se pudo cargar la receta.')
    await router.replace({ name: 'prescriptions' })
  }
})

/** Abre el diálogo de impresión; los estilos print: ocultan menú, barra y botones. */
function print(): void {
  window.print()
}

function onRescheduled(updated: Prescription): void {
  prescription.value = updated
  toast.success(`Llamada reagendada para ${formatDateTime(updated.callback_at!)}.`)
}

async function cancel(): Promise<void> {
  cancelling.value = true
  try {
    const response = await api.post<Resource<Prescription>>(`/prescriptions/${props.id}/cancel`)
    prescription.value = response.data
    toast.success('Receta cancelada.')
  } catch (error) {
    toast.error(error instanceof ApiError ? error.message : 'No se pudo cancelar.')
  } finally {
    cancelling.value = false
    cancelOpen.value = false
  }
}
</script>

<template>
  <div v-if="!prescription" class="h-96 animate-pulse rounded-lg bg-white shadow-card" />

  <template v-else>
    <!-- Acciones (no se imprimen). -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <RouterLink
        :to="{ name: 'prescriptions' }"
        class="inline-flex items-center gap-2 hover:text-primary"
      >
        <ArrowLeft class="size-4" /> Recetas
      </RouterLink>

      <div class="flex flex-wrap gap-3">
        <template v-if="prescription.can.handle_call">
          <BaseButton variant="flat" @click="rescheduleOpen = true">
            <CalendarClock class="size-4" /> Reagendar
          </BaseButton>
          <BaseButton variant="outline" @click="cancelOpen = true">
            <XCircle class="size-4" /> Cancelar receta
          </BaseButton>
          <RouterLink
            :to="{ name: 'order-create', params: { id: prescription.id } }"
            class="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 font-medium text-white hover:shadow-[0_8px_25px_-8px_var(--color-primary)]"
          >
            <ShoppingCart class="size-4" /> Crear pedido
          </RouterLink>
        </template>
        <RouterLink
          v-if="prescription.can.update"
          :to="{ name: 'prescription-edit', params: { id: prescription.id } }"
          class="inline-flex items-center gap-2 rounded-md border border-primary px-6 py-2.5 font-medium text-primary hover:bg-primary/5"
        >
          <Pencil class="size-4" /> Editar
        </RouterLink>
        <BaseButton v-if="prescription.can.send" variant="flat" @click="sendOpen = true">
          <Mail class="size-4" /> Enviar por correo
        </BaseButton>
        <BaseButton @click="print"><Printer class="size-4" /> Imprimir</BaseButton>
      </div>
    </div>

    <!-- Estado (no se imprime). -->
    <div class="mb-6 flex flex-wrap items-center gap-3 print:hidden">
      <BaseBadge :variant="prescriptionStatusVariants[prescription.status]">
        {{ prescription.status_label }}
      </BaseBadge>
      <span v-if="prescription.status === 'rescheduled' && prescription.callback_at">
        Llamar el {{ formatDateTime(prescription.callback_at) }}
      </span>
      <span v-if="!prescription.allows_call_center" class="text-sm">
        El médico no autorizó llamadas del call-center.
      </span>
    </div>

    <!-- Receta imprimible. -->
    <BaseCard class="print:shadow-none">
      <div class="grid gap-8 leading-relaxed md:grid-cols-2 print:grid-cols-2">
        <div>
          <img
            v-if="prescription.doctor.doctor_profile?.clinic_logo_url"
            :src="prescription.doctor.doctor_profile.clinic_logo_url"
            alt="Logo de la clínica"
            class="h-20 w-auto object-contain"
          />
        </div>
        <div class="md:text-right print:text-right">
          <h1 class="text-3xl">Receta</h1>
          <p class="mt-2 font-semibold text-heading">No. {{ prescription.id }}</p>
          <p>Fecha: {{ formatDate(prescription.issued_on) }}</p>
        </div>

        <div>
          <h5 class="mb-2 font-semibold">Paciente</h5>
          <p class="text-heading">{{ prescription.patient_name }}</p>
          <p>{{ prescription.patient_phone }}</p>
          <p v-if="prescription.patient_email">{{ prescription.patient_email }}</p>
        </div>
        <div class="md:text-right print:text-right">
          <h5 class="mb-2 font-semibold">
            {{ prescription.doctor.doctor_profile?.clinic_name || 'Médico' }}
          </h5>
          <p class="font-semibold text-heading">{{ prescription.doctor.name }}</p>
          <p v-if="prescription.doctor.collegiate_number">
            Colegiado {{ prescription.doctor.collegiate_number }}
          </p>
          <p v-if="prescription.doctor.doctor_profile?.clinic_address">
            {{ prescription.doctor.doctor_profile.clinic_address }}
          </p>
          <p v-if="prescription.doctor.doctor_profile?.clinic_phone">
            Tel. {{ prescription.doctor.doctor_profile.clinic_phone }}
          </p>
        </div>
      </div>

      <table class="mt-10 w-full text-left">
        <thead>
          <tr class="border-b border-black/10">
            <th class="py-3 pr-4 text-xs font-semibold text-heading uppercase">Medicamento</th>
            <th class="py-3 text-xs font-semibold text-heading uppercase">Indicaciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in prescription.items" :key="item.id" class="border-b border-black/5">
            <td class="py-3 pr-4 align-top">
              <p class="font-medium text-heading">{{ item.product.name }}</p>
              <p class="text-xs">{{ item.product.presentation.label }}</p>
            </td>
            <td class="py-3 align-top">{{ item.dosage_instructions }}</td>
          </tr>
        </tbody>
      </table>

      <p v-if="prescription.next_appointment_on" class="mt-6">
        <strong>Próxima cita:</strong> {{ formatDate(prescription.next_appointment_on) }}
      </p>

      <p class="mt-12 text-right text-sm font-semibold text-primary">SIT Marketplace</p>
    </BaseCard>

    <!-- Datos clínicos: solo llegan para el médico autor y no se imprimen. -->
    <BaseCard v-if="prescription.symptoms !== undefined" title="Consulta" class="mt-6 print:hidden">
      <dl class="grid gap-4 md:grid-cols-3">
        <div>
          <dt class="font-semibold text-heading">Síntomas</dt>
          <dd>{{ prescription.symptoms || '—' }}</dd>
        </div>
        <div>
          <dt class="font-semibold text-heading">Diagnóstico</dt>
          <dd>{{ prescription.diagnosis || '—' }}</dd>
        </div>
        <div>
          <dt class="font-semibold text-heading">Observaciones</dt>
          <dd>{{ prescription.observations || '—' }}</dd>
        </div>
      </dl>
    </BaseCard>

    <RescheduleModal
      v-model:open="rescheduleOpen"
      :prescription="prescription"
      @saved="onRescheduled"
    />
    <SendPrescriptionModal
      v-model:open="sendOpen"
      :prescription="prescription"
      @sent="(email) => prescription && (prescription.patient_email = email)"
    />
    <ConfirmModal
      v-model:open="cancelOpen"
      title="Cancelar receta"
      :message="`¿Cancelar la receta No. ${prescription.id}? El paciente no quiere el pedido.`"
      confirm-label="Cancelar receta"
      :loading="cancelling"
      @confirm="cancel"
    />
  </template>
</template>
