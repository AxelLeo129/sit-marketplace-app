<script setup lang="ts">
/**
 * Listado de productos con búsqueda, filtros por categoría y laboratorio,
 * y administración (crear, editar, eliminar) para el administrador.
 */
import { onMounted, ref } from 'vue'
import { ImageOff, Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'
import ConfirmModal from '@/components/ConfirmModal.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import TableSkeleton from '@/components/ui/TableSkeleton.vue'
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BasePagination from '@/components/ui/BasePagination.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { useCatalogOptions } from '@/composables/useCatalogOptions'
import { usePaginatedList } from '@/composables/usePaginatedList'
import { api, ApiError } from '@/services/api'
import { useToastStore } from '@/stores/toast'
import type { Product } from '@/types/catalog'
import { formatMoney } from '@/utils/format'
import ProductFormModal from './components/ProductFormModal.vue'

type ProductFilters = {
  search: string
  category_id: number | null
  lab_id: number | null
  include_inactive: boolean
}

const toast = useToastStore()
const catalog = useCatalogOptions()
const list = usePaginatedList<Product, ProductFilters>('/products', {
  search: '',
  category_id: null,
  lab_id: null,
  include_inactive: true,
})

const formOpen = ref(false)
const editing = ref<Product | null>(null)
const toDelete = ref<Product | null>(null)
const deleting = ref(false)

onMounted(() => Promise.all([list.load(), catalog.load()]))

function openForm(product: Product | null = null): void {
  editing.value = product
  formOpen.value = true
}

async function remove(): Promise<void> {
  if (!toDelete.value) return

  deleting.value = true
  try {
    await api.delete(`/products/${toDelete.value.id}`)
    toast.success(`Se eliminó «${toDelete.value.name}».`)
    await list.load()
  } catch (error) {
    toast.error(error instanceof ApiError ? error.message : 'No se pudo eliminar.')
  } finally {
    deleting.value = false
    toDelete.value = null
  }
}

/** Existencias bajas en amarillo y agotadas en rojo. */
function stockVariant(stock: number): 'success' | 'warning' | 'danger' {
  if (stock === 0) return 'danger'
  return stock < 10 ? 'warning' : 'success'
}
</script>

<template>
  <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <h2 class="text-2xl">Productos</h2>
    <BaseButton @click="openForm()"><Plus class="size-4" /> Agregar producto</BaseButton>
  </div>

  <div class="mb-4 grid gap-4 rounded-lg bg-white p-5 shadow-card md:grid-cols-4">
    <BaseInput
      v-model="list.filters.search"
      placeholder="Buscar por nombre"
      :icon="Search"
      class="md:col-span-2"
    />
    <BaseSelect
      v-model="list.filters.category_id"
      :options="catalog.categoryOptions.value"
      placeholder="Todas las categorías"
    />
    <BaseSelect
      v-model="list.filters.lab_id"
      :options="catalog.labOptions.value"
      placeholder="Todos los laboratorios"
    />
    <BaseCheckbox
      v-model="list.filters.include_inactive"
      label="Incluir inactivos"
      class="md:col-span-4"
    />
  </div>

  <BaseAlert v-if="list.error.value" variant="danger">{{ list.error.value }}</BaseAlert>

  <div
    class="overflow-x-auto transition-opacity"
    :class="{ 'opacity-50': list.loading.value }"
    :aria-busy="list.loading.value"
  >
    <table class="data-table">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Laboratorio</th>
          <th>Precio</th>
          <th>Costo</th>
          <th>Existencias</th>
          <th>Estado</th>
          <th class="text-right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <TableSkeleton v-if="list.loading.value && list.items.value.length === 0" :columns="7" />
        <tr v-for="product in list.items.value" :key="product.id">
          <td>
            <div class="flex items-center gap-3">
              <img
                v-if="product.image_url"
                :src="product.image_url"
                alt=""
                class="size-10 rounded-md object-cover"
              />
              <span v-else class="grid size-10 shrink-0 place-items-center rounded-md bg-black/5">
                <ImageOff class="size-4 text-content/50" />
              </span>
              <div>
                <p class="font-medium text-heading">{{ product.name }}</p>
                <p class="text-xs">{{ product.presentation.label }}</p>
              </div>
            </div>
          </td>
          <td>{{ product.lab.name }}</td>
          <td class="whitespace-nowrap">{{ formatMoney(product.price) }}</td>
          <td class="whitespace-nowrap">{{ product.cost ? formatMoney(product.cost) : '—' }}</td>
          <td>
            <BaseBadge :variant="stockVariant(product.stock)">{{ product.stock }}</BaseBadge>
          </td>
          <td>
            <BaseBadge :variant="product.is_active ? 'success' : 'muted'">
              {{ product.is_active ? 'Activo' : 'Inactivo' }}
            </BaseBadge>
            <BaseBadge v-if="product.is_regulated" variant="warning" class="ml-1">
              Controlado
            </BaseBadge>
          </td>
          <td class="text-right whitespace-nowrap">
            <button
              type="button"
              class="cursor-pointer p-1 hover:text-primary"
              :aria-label="`Editar ${product.name}`"
              @click="openForm(product)"
            >
              <Pencil class="size-4" />
            </button>
            <button
              type="button"
              class="cursor-pointer p-1 hover:text-danger"
              :aria-label="`Eliminar ${product.name}`"
              @click="toDelete = product"
            >
              <Trash2 class="size-4" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="!list.loading.value && list.items.value.length === 0" class="py-8 text-center">
      No se encontraron productos.
    </p>
  </div>

  <BasePagination v-if="list.meta.value" :meta="list.meta.value" @change="list.goToPage" />

  <ProductFormModal
    v-model:open="formOpen"
    :product="editing"
    :categories="catalog.categories.value"
    :lab-options="catalog.labOptions.value"
    :presentation-options="catalog.presentationOptions.value"
    @saved="list.load"
  />

  <ConfirmModal
    :open="toDelete !== null"
    :message="`¿Eliminar «${toDelete?.name}»? Dejará de aparecer en el catálogo; los pedidos anteriores lo conservan.`"
    :loading="deleting"
    @update:open="(open) => !open && (toDelete = null)"
    @confirm="remove"
  />
</template>
