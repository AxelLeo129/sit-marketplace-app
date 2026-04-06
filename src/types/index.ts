export interface Role {
  id: number
  name: string
}

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  birth_date: string | null
  avatar_url: string | null
  role: Role
  created_at: string
}

export interface Address {
  id: number
  user_id: number
  label: string
  recipient_name: string
  phone: string
  country: string
  state: string
  city: string
  street: string
  apartment: string | null
  postal_code: string
  is_default: boolean
}

export interface Store {
  id: number
  user_id: number
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  phone: string | null
  is_active: boolean
  products_count?: number
  created_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  parent_id: number | null
  children?: Category[]
}

export interface ProductImage {
  id: number
  product_id: number
  url: string
  sort_order: number
}

export interface Product {
  id: number
  store_id: number
  name: string
  slug: string
  description: string | null
  price: number
  stock: number
  is_active: boolean
  store?: Store
  images: ProductImage[]
  categories: Category[]
  created_at: string
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  quantity: number
  unit_price: number
  subtotal: number
  product?: Product
}

export interface Order {
  id: number
  user_id: number
  address_id: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  notes: string | null
  confirmed_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  address?: Address
  items: OrderItem[]
  created_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  links: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
  phone?: string
  birth_date?: string
  role_id: number
}

export interface StoreOrderPayload {
  address_id: number
  notes?: string
  items: { product_id: number; quantity: number }[]
}
