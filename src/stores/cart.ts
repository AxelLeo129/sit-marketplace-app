import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Product } from '@/types'

export interface CartItem {
  product: Product
  quantity: number
}

const STORAGE_KEY = 'cart'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(loadCart())

  const totalItems = computed(() => items.value.reduce((sum, i) => sum + i.quantity, 0))
  const totalPrice = computed(() =>
    items.value.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
  )

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
  }

  function addItem(product: Product, quantity = 1) {
    const existing = items.value.find((i) => i.product.id === product.id)
    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({ product, quantity })
    }
    persist()
  }

  function updateQuantity(productId: number, quantity: number) {
    const item = items.value.find((i) => i.product.id === productId)
    if (!item) return
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    item.quantity = quantity
    persist()
  }

  function removeItem(productId: number) {
    items.value = items.value.filter((i) => i.product.id !== productId)
    persist()
  }

  function clear() {
    items.value = []
    persist()
  }

  return { items, totalItems, totalPrice, addItem, updateQuantity, removeItem, clear }
})
