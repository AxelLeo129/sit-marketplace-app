import type { Category } from './user'

export type { Category }

export interface Lab {
  id: number
  name: string
  products_count?: number
}

export interface Presentation {
  id: number
  name: string
  unit: string
  quantity: number
  /** Texto listo para mostrar, p. ej. "Caja de 30 tabletas". */
  label: string
  products_count?: number
}

export interface Product {
  id: number
  name: string
  description: string | null
  /** Montos como texto con dos decimales, p. ej. "112.00". */
  price: string
  /** Solo llega para el administrador. */
  cost?: string
  stock: number
  warehouse: string | null
  is_active: boolean
  is_regulated: boolean
  observations: string | null
  image_url: string | null
  presentation: Presentation
  lab: Lab
  categories: Category[]
  updated_at: string
}
