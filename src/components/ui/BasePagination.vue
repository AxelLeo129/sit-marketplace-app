<script setup lang="ts">
/**
 * Paginación de una lista de la API: "Mostrando 1-20 de 57" y botones anterior/siguiente.
 */
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}>()
const emit = defineEmits<{ change: [page: number] }>()

const range = computed(() => {
  const { current_page, per_page, total } = props.meta
  const from = total === 0 ? 0 : (current_page - 1) * per_page + 1
  return `${from}-${Math.min(current_page * per_page, total)} de ${total}`
})
</script>

<template>
  <nav class="flex items-center justify-between gap-4 pt-4" aria-label="Paginación">
    <span class="text-sm">Mostrando {{ range }}</span>
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="grid size-8 cursor-pointer place-items-center rounded-full bg-black/5 hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black/5 disabled:hover:text-content"
        :disabled="meta.current_page <= 1"
        aria-label="Página anterior"
        @click="emit('change', meta.current_page - 1)"
      >
        <ChevronLeft class="size-4" />
      </button>
      <span class="text-sm">{{ meta.current_page }} / {{ meta.last_page }}</span>
      <button
        type="button"
        class="grid size-8 cursor-pointer place-items-center rounded-full bg-black/5 hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black/5 disabled:hover:text-content"
        :disabled="meta.current_page >= meta.last_page"
        aria-label="Página siguiente"
        @click="emit('change', meta.current_page + 1)"
      >
        <ChevronRight class="size-4" />
      </button>
    </div>
  </nav>
</template>
