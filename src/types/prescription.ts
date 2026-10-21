import type { Product } from './catalog'
import type { DoctorProfile } from './user'

/** Estados de una receta (App\Enums\PrescriptionStatus en la API). */
export type PrescriptionStatus = 'pending' | 'rescheduled' | 'ordered' | 'cancelled'

export const prescriptionStatusLabels: Record<PrescriptionStatus, string> = {
  pending: 'Nueva',
  rescheduled: 'Reagendada',
  ordered: 'Con pedido',
  cancelled: 'Cancelada',
}

/** Color de la etiqueta de cada estado. */
export const prescriptionStatusVariants = {
  pending: 'warning',
  rescheduled: 'info',
  ordered: 'success',
  cancelled: 'muted',
} as const satisfies Record<PrescriptionStatus, string>

export interface PrescriptionItem {
  id: number
  dosage_instructions: string
  product: Product
}

export interface Prescription {
  id: number
  status: PrescriptionStatus
  status_label: string
  patient_name: string
  patient_phone: string
  patient_email: string | null
  /** Datos clínicos: solo llegan para el médico que emitió la receta. */
  symptoms?: string | null
  diagnosis?: string | null
  observations?: string | null
  issued_on: string
  next_appointment_on: string | null
  allows_call_center: boolean
  callback_at: string | null
  doctor: {
    id: number
    name: string
    collegiate_number: string | null
    doctor_profile: DoctorProfile | null
  }
  items: PrescriptionItem[]
  /** Acciones que el usuario puede hacer sobre esta receta. */
  can: { update: boolean; handle_call: boolean; send: boolean }
  created_at: string
}
