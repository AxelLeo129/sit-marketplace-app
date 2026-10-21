<script setup lang="ts">
/**
 * Administración de un catálogo que solo tiene nombre: categorías o laboratorios.
 * La ruta indica cuál con sus props, p. ej. endpoint "/labs", title "Laboratorios",
 * singular "laboratorio" y newTitle "Nuevo laboratorio".
 */
import { onMounted, ref } from 'vue'
import { Pencil, Plus, Trash2 } from 'lucide-vue-next'
import ConfirmModal from '@/components/ConfirmModal.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import TableSkeleton from '@/components/ui/TableSkeleton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useForm } from '@/composables/useForm'
import { api, ApiError } from '@/services/api'
import { useToastStore } from '@/stores/toast'
import type { Collection } from '@/types/api'

interface NamedItem {
  id: number
  name: string
  products_count?: number
}

const props = defineProps<{ endpoint: string; title: string; singular: string; newTitle: string }>()

const toast = useToastStore()
const items = ref<NamedItem[]>([])
const loading = ref(true)

const formOpen = ref(false)
const editing = ref<NamedItem | null>(null)
const form = useForm({ name: '' })

const toDelete = ref<NamedItem | null>(null)
const deleting = ref(false)

async function load(): Promise<void> {
  loading.value = true
  items.value = (await api.get<Collection<NamedItem>>(props.endpoint)).data
  loading.value = false
}

onMounted(load)

function openForm(item: NamedItem | null = null): void {
  editing.value = item
  form.reset()
  form.data.name = item?.name ?? ''
  formOpen.value = true
}

async function save(): Promise<void> {
  const saved = await form.submit(() =>
    editing.value
      ? api.put(`${props.endpoint}/${editing.value.id}`, form.data)
      : api.post(props.endpoint, form.data),
  )

  if (saved) {
    formOpen.value = false
    toast.success(editing.value ? 'Cambios guardados.' : `Se agregó «${form.data.name}».`)
    await load()
  }
}

async function remove(): Promise<void> {
  if (!toDelete.value) return

  deleting.value = true
  try {
    await api.delete(`${props.endpoint}/${toDelete.value.id}`)
    toast.success(`Se eliminó «${toDelete.value.name}».`)
    await load()
  } catch (error) {
    // P. ej. 409: un laboratorio con productos no se puede eliminar.
    toast.error(error instanceof ApiError ? error.message : 'No se pudo eliminar.')
  } finally {
    deleting.value = false
    toDelete.value = null
  }
}
</script>

<template>
  <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <h2 class="text-2xl">{{ title }}</h2>
    <BaseButton @click="openForm()"><Plus class="size-4" /> Agregar</BaseButton>
  </div>

  <div
    class="overflow-x-auto transition-opacity"
    :class="{ 'opacity-50': loading }"
    :aria-busy="loading"
  >
    <table class="data-table">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Productos</th>
          <th class="text-right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <TableSkeleton v-if="loading && items.length === 0" :columns="3" />
        <tr v-for="item in items" :key="item.id">
          <td class="font-medium text-heading">{{ item.name }}</td>
          <td>{{ item.products_count ?? 0 }}</td>
          <td class="text-right whitespace-nowrap">
            <button
              type="button"
              class="cursor-pointer p-1 hover:text-primary"
              :aria-label="`Editar ${item.name}`"
              @click="openForm(item)"
            >
              <Pencil class="size-4" />
            </button>
            <button
              type="button"
              class="cursor-pointer p-1 hover:text-danger"
              :aria-label="`Eliminar ${item.name}`"
              @click="toDelete = item"
            >
              <Trash2 class="size-4" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="!loading && items.length === 0" class="py-8 text-center">No hay registros.</p>
  </div>

  <BaseModal v-model:open="formOpen" :title="editing ? `Editar ${singular}` : newTitle">
    <form id="named-catalog-form" class="space-y-4" novalidate @submit.prevent="save">
      <BaseAlert v-if="form.message.value" variant="danger">{{ form.message.value }}</BaseAlert>
      <BaseInput v-model="form.data.name" label="Nombre" :error="form.errors.value.name" required />
    </form>
    <template #footer>
      <BaseButton variant="outline" @click="formOpen = false">Cancelar</BaseButton>
      <BaseButton type="submit" form="named-catalog-form" :loading="form.processing.value">
        Guardar
      </BaseButton>
    </template>
  </BaseModal>

  <ConfirmModal
    :open="toDelete !== null"
    :message="`¿Eliminar «${toDelete?.name}»? Esta acción no se puede deshacer.`"
    :loading="deleting"
    @update:open="(open) => !open && (toDelete = null)"
    @confirm="remove"
  />
</template>
