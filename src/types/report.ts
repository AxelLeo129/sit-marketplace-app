import type { OrderStatus } from './order'
import type { Role } from './user'

/** Período aplicado por la API, "AAAA-MM-DD". */
export interface ReportPeriod {
  from: string
  to: string
}

/** GET /reports/sales. Montos como texto con dos decimales. */
export interface SalesReport {
  period: ReportPeriod
  summary: {
    orders_count: number
    units: number
    sales: string
    net: string
    vat: string
    card_fees: string
    cost: string
    gross_margin: string
    commissions: string
    /** Margen menos comisiones. */
    profit: string
  }
  series: { period: string; orders_count: number; sales: string; gross_margin: string }[]
  top_products: {
    product_id: number
    name: string
    units: number
    sales: string
    gross_margin: string
  }[]
  /** Pedidos creados en el período, por estado. */
  orders_by_status: Record<OrderStatus, number>
}

/** GET /reports/commissions */
export interface CommissionsReport {
  period: ReportPeriod
  total: string
  data: {
    user_id: number
    name: string
    role: Role
    role_label: string
    orders_count: number
    amount: string
  }[]
}

/** Una línea de GET /reports/my-commissions. */
export interface CommissionLine {
  id: number
  order_id: number
  delivered_at: string
  product_name: string
  quantity: number
  role: Role
  role_label: string
  rate: string
  amount: string
}

/** GET /reports/my-commissions (paginado, con el total del período). */
export interface MyCommissionsReport {
  data: CommissionLine[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
  period: ReportPeriod
  total: string
}
