/** Roles del sistema (App\Enums\Role en la API). */
export type Role =
  | 'admin'
  | 'doctor'
  | 'sales_rep'
  | 'call_center'
  | 'billing'
  | 'dispatcher'
  | 'courier'

/** Nombre visible de cada rol (igual que en la API). */
export const roleLabels: Record<Role, string> = {
  admin: 'Administrador',
  doctor: 'Médico',
  sales_rep: 'Visitador',
  call_center: 'Call-Center',
  billing: 'Facturador',
  dispatcher: 'Despachador',
  courier: 'Mensajero',
}

export interface Category {
  id: number
  name: string
  products_count?: number
}

/** Datos de la clínica del médico, impresos en sus recetas. */
export interface DoctorProfile {
  clinic_name: string | null
  clinic_phone: string | null
  clinic_address: string | null
  clinic_logo_url: string | null
  keeps_clinical_record: boolean
  show_alerts: boolean
}

export interface User {
  id: number
  name: string
  email: string
  collegiate_number: string | null
  phone: string | null
  birth_date: string | null
  avatar_url: string | null
  role: Role
  role_label: string
  is_active: boolean
  sales_rep?: { id: number; name: string } | null
  doctor_profile?: DoctorProfile | null
  specialties?: Category[]
  created_at: string
}
