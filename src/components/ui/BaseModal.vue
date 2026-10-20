<script setup lang="ts">
/**
 * Ventana modal (vs-popup de Vuexy). Se cierra con Esc, con la X o al hacer clic fuera.
 */
import { onBeforeUnmount, watch } from 'vue'
import { X } from 'lucide-vue-next'

withDefaults(defineProps<{ title: string; size?: 'md' | 'lg' }>(), { size: 'md' })

const open = defineModel<boolean>('open', { required: true })

function closeOnEscape(event: KeyboardEvent): void {
  if (event.key === 'Escape') open.value = false
}

// Escucha Esc y bloquea el scroll de la página solo mientras está abierto.
watch(
  open,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    if (isOpen) document.addEventListener('keydown', closeOnEscape)
    else document.removeEventListener('keydown', closeOnEscape)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', closeOnEscape)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      enter-active-class="transition duration-200"
      leave-active-class="transition duration-200"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="open = false"
      >
        <!-- Alto máximo del 80 % de la pantalla: el contenido hace scroll y
             el título y los botones quedan siempre visibles. -->
        <div
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          class="flex max-h-[80vh] w-full flex-col rounded-lg bg-white shadow-card"
          :class="size === 'lg' ? 'max-w-3xl' : 'max-w-lg'"
        >
          <header
            class="flex shrink-0 items-center justify-between border-b border-black/5 px-6 py-4"
          >
            <h4 class="text-lg">{{ title }}</h4>
            <button
              type="button"
              class="cursor-pointer rounded-md p-1 text-content hover:bg-black/5"
              aria-label="Cerrar"
              @click="open = false"
            >
              <X class="size-5" />
            </button>
          </header>
          <div class="min-h-0 flex-1 overflow-y-auto p-6">
            <slot />
          </div>
          <footer
            v-if="$slots.footer"
            class="flex shrink-0 justify-end gap-3 border-t border-black/5 px-6 py-4"
          >
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
