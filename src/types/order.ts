import type { Presentation } from './catalog'
import type { Role } from './user'

export type AddressType = 'billing' | 'shipping'

export interface CustomerAddress {
  id: number
  type: AddressType
  country: string | null
  department: string
  municipality: string
  street: string
  apartment: string | null
  neighborhood: string | null
  postal_code: string | null
  phone: string | null
  /** Dirección en una línea, lista para mostrar. */
  full_address: string
}

export interface Customer {
  id: number
  name: string
  /** NIT o "CF" (consumidor final). */
  tax_id: string
  phone: string
  email: string | null
  gender: string | null
  birth_date: string | null
  addresses: CustomerAddress[]
}

/** Estados de un pedido (App\Enums\OrderStatus en la API). */
export type OrderStatus =
  | 'pending_invoice'
  | 'invoiced'
  | 'assigned'
  | 'in_transit'
  | 'delivered'
  | 'delivery_failed'
  | 'cancelled'

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending_invoice: 'Pendiente de factura',
  invoiced: 'Facturado',
  assigned: 'Asignado',
  in_transit: 'En ruta',
  delivered: 'Entregado',
  delivery_failed: 'No entregado',
  cancelled: 'Cancelado',
}

export const orderStatusVariants = {
  pending_invoice: 'warning',
  invoiced: 'info',
  assigned: 'primary',
  in_transit: 'primary',
  delivered: 'success',
  delivery_failed: 'danger',
  cancelled: 'muted',
} as const satisfies Record<OrderStatus, string>

export type PaymentMethod = 'cash_on_delivery' | 'card'

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash_on_delivery: 'Pago contra entrega',
  card: 'Tarjeta',
}

export interface Commission {
  role: Role
  role_label: string
  /** Null mientras no haya beneficiario (p. ej. mensajero sin asignar). */
  beneficiary: { id: number; name: string } | null
  rate: string
  amount: string
}

export interface OrderItem {
  id: number
  product: { id: number; name: string; presentation: Presentation | null }
  /** Recetado por el médico o agregado por el call-center. */
  origin: 'prescribed' | 'added_by_call_center'
  quantity: number
  unit_price: string
  line_total: string
  /** Solo facturación y administrador. */
  net_amount?: string
  vat_amount?: string
  /** Solo administrador. */
  unit_cost?: string
  card_fee_amount?: string
  gross_margin?: string
  purchase_number?: number
  commissions?: Commission[]
}

interface PersonRef {
  id: number
  name: string
}

export interface Order {
  id: number
  status: OrderStatus
  status_label: string
  prescription_id: number | null
  customer: Customer
  billing_address: CustomerAddress
  shipping_address: CustomerAddress
  created_by: PersonRef
  payment: {
    method: PaymentMethod
    method_label: string
    reference: string | null
    cardholder_name: string | null
    card_last_four: string | null
  }
  vat_rate: string
  total: string
  invoice: {
    tax_id: string | null
    number: string | null
    invoiced_at: string | null
    invoiced_by: PersonRef | null
  }
  delivery: {
    courier: PersonRef | null
    assigned_at: string | null
    dispatched_at: string | null
    delivered_at: string | null
    received_by: string | null
    notes: string | null
  }
  items: OrderItem[]
  /** Acciones que el usuario puede hacer ahora sobre el pedido. */
  can: {
    cancel: boolean
    invoice: boolean
    assign: boolean
    start_delivery: boolean
    complete_delivery: boolean
  }
  created_at: string
}
