import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface Toast {
  id: number
  message: string
  variant: 'success' | 'danger'
}

/**
 * Notificaciones breves en la esquina superior derecha (vs-notify de Vuexy).
 */
export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  let nextId = 1

  function show(message: string, variant: Toast['variant'] = 'success'): void {
    const toast = { id: nextId++, message, variant }
    toasts.value.push(toast)
    setTimeout(() => dismiss(toast.id), 4000)
  }

  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  return {
    toasts,
    success: (message: string) => show(message, 'success'),
    error: (message: string) => show(message, 'danger'),
    dismiss,
  }
})
