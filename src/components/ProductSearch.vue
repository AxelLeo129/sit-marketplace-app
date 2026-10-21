<script setup lang="ts">
/**
 * Buscador de productos activos: escribe parte del nombre y elige uno de la lista.
 * Se usa al recetar y al armar pedidos.
 */
import { onBeforeUnmount, ref, watch } from 'vue'
import { LoaderCircle, Search } from 'lucide-vue-next'
import { api } from '@/services/api'
import type { Collection } from '@/types/api'
import type { Product } from '@/types/catalog'
import { formatMoney } from '@/utils/format'

const props = withDefaults(
  defineProps<{ placeholder?: string; excludeIds?: number[]; error?: string }>(),
  { placeholder: 'Buscar medicamento por nombre', excludeIds: () => [] },
)
const emit = defineEmits<{ select: [product: Product] }>()

const search = ref('')
const results = ref<Product[]>([])
const loading = ref(false)
const open = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

// Busca cuando el usuario deja de escribir (mínimo 2 letras).
watch(search, (text) => {
  clearTimeout(timer)
  if (text.trim().length < 2) {
    results.value = []
    open.value = false
    return
  }
  timer = setTimeout(() => find(text.trim()), 300)
})

onBeforeUnmount(() => clearTimeout(timer))

async function find(text: string): Promise<void> {
  loading.value = true
  try {
    const params = new URLSearchParams({ search: text, per_page: '10' })
    const response = await api.get<Collection<Product>>(`/products?${params}`)
    results.value = response.data.filter((product) => !props.excludeIds.includes(product.id))
    open.value = true
  } catch {
    results.value = []
    open.value = false
  } finally {
    loading.value = false
  }
}

function choose(product: Product): void {
  emit('select', product)
  search.value = ''
  open.value = false
}
</script>

<template>
  <div class="relative">
    <Search
      class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-content/60"
    />
    <input
      v-model="search"
      type="search"
      :placeholder="placeholder"
      autocomplete="off"
      :aria-invalid="error ? 'true' : undefined"
      class="w-full rounded-md border bg-white py-2.5 pr-10 pl-10 text-heading outline-none focus:shadow-[0_3px_10px_0_rgb(0_0_0_/_0.15)]"
      :class="error ? 'border-danger' : 'border-black/20 focus:border-primary'"
      @keydown.esc="open = false"
      @blur="open = false"
    />
    <LoaderCircle
      v-if="loading"
      class="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-primary"
    />

    <ul
      v-if="open"
      class="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md bg-white py-1 shadow-card"
      role="listbox"
    >
      <li v-if="results.length === 0" class="px-4 py-3 text-sm">Sin resultados.</li>
      <li v-for="product in results" :key="product.id">
        <!-- mousedown en lugar de click: se dispara antes del blur que cierra la lista. -->
        <button
          type="button"
          class="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2 text-left hover:bg-primary/5"
          @mousedown.prevent="choose(product)"
        >
          <span>
            <span class="block font-medium text-heading">{{ product.name }}</span>
            <span class="text-xs">{{ product.presentation.label }} · {{ product.lab.name }}</span>
          </span>
          <span class="text-sm whitespace-nowrap">{{ formatMoney(product.price) }}</span>
        </button>
      </li>
    </ul>
    <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>
  </div>
</template>
