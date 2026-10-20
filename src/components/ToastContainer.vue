<script setup lang="ts">
/**
 * Muestra las notificaciones de useToastStore.
 */
import { CircleAlert, CircleCheck, X } from 'lucide-vue-next'
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()
</script>

<template>
  <div class="fixed top-5 right-5 z-[60] flex w-80 flex-col gap-3" aria-live="polite">
    <TransitionGroup
      enter-from-class="translate-x-8 opacity-0"
      leave-to-class="translate-x-8 opacity-0"
      enter-active-class="transition duration-300"
      leave-active-class="transition duration-300"
    >
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="flex items-start gap-3 rounded-md px-4 py-3 text-white shadow-card"
        :class="toast.variant === 'success' ? 'bg-success' : 'bg-danger'"
        :role="toast.variant === 'danger' ? 'alert' : 'status'"
      >
        <component
          :is="toast.variant === 'success' ? CircleCheck : CircleAlert"
          class="mt-0.5 size-4 shrink-0"
        />
        <p class="flex-1">{{ toast.message }}</p>
        <button
          type="button"
          class="cursor-pointer"
          aria-label="Cerrar"
          @click="toastStore.dismiss(toast.id)"
        >
          <X class="size-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
