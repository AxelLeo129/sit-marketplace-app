<script setup lang="ts">
/**
 * Administración de presentaciones: nombre, unidad y cantidad ("Caja de 30 tabletas").
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
import type { Presentation } from '@/types/catalog'

const toast = useToastStore()
const items = ref<Presentation[]>([])
const loading = ref(true)

const formOpen = ref(false)
const editing = ref<Presentation | null>(null)
const form = useForm({ name: '', unit: '', quantity: 1 as number | null })

const toDelete = ref<Presentation | null>(null)
const deleting = ref(false)

async function load(): Promise<void> {
  loading.value = true
  items.value = (await api.get<Collection<Presentation>>('/presentations')).data
  loading.value = false
}

onMounted(load)

function openForm(item: Presentation | null = null): void {
  editing.value = item
  form.reset()
  if (item) {
    Object.assign(form.data, { name: item.name, unit: item.unit, quantity: item.quantity })
  }
  formOpen.value = true
}

async function save(): Promise<void> {
  const saved = await form.submit(() =>
    editing.value
      ? api.put(`/presentations/${editing.value.id}`, form.data)
      : api.post('/presentations', form.data),
  )

  if (saved) {
    formOpen.value = false
    toast.success(editing.value ? 'Cambios guardados.' : 'Se agregó la presentación.')
    await load()
  }
}

async function remove(): Promise<void> {
  if (!toDelete.value) return

  deleting.value = true
  try {
    await api.delete(`/presentations/${toDelete.value.id}`)
    toast.success(`Se eliminó «${toDelete.value.label}».`)
    await load()
  } catch (error) {
    // 409: tiene productos asociados.
    toast.error(error instanceof ApiError ? error.message : 'No se pudo eliminar.')
  } finally {
    deleting.value = false
    toDelete.value = null
  }
}
</script>

<template>
  <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <h2 class="text-2xl">Presentaciones</h2>
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
          <th>Presentación</th>
          <th>Nombre</th>
          <th>Unidad</th>
          <th>Cantidad</th>
          <th>Productos</th>
          <th class="text-right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <TableSkeleton v-if="loading && items.length === 0" :columns="6" />
        <tr v-for="item in items" :key="item.id">
          <td class="font-medium text-heading">{{ item.label }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.unit }}</td>
          <td>{{ item.quantity }}</td>
          <td>{{ item.products_count ?? 0 }}</td>
          <td class="text-right whitespace-nowrap">
            <button
              type="button"
              class="cursor-pointer p-1 hover:text-primary"
              :aria-label="`Editar ${item.label}`"
              @click="openForm(item)"
            >
              <Pencil class="size-4" />
            </button>
            <button
              type="button"
              class="cursor-pointer p-1 hover:text-danger"
              :aria-label="`Eliminar ${item.label}`"
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

  <BaseModal
    v-model:open="formOpen"
    :title="editing ? 'Editar presentación' : 'Nueva presentación'"
  >
    <form id="presentation-form" class="space-y-4" novalidate @submit.prevent="save">
      <BaseAlert v-if="form.message.value" variant="danger">{{ form.message.value }}</BaseAlert>
      <BaseInput
        v-model="form.data.name"
        label="Nombre"
        placeholder="Caja"
        :error="form.errors.value.name"
        required
      />
      <div class="grid grid-cols-2 gap-4">
        <BaseInput
          v-model="form.data.quantity"
          label="Cantidad"
          type="number"
          :error="form.errors.value.quantity"
          required
        />
        <BaseInput
          v-model="form.data.unit"
          label="Unidad"
          placeholder="tabletas"
          :error="form.errors.value.unit"
          required
        />
      </div>
      <p v-if="form.data.name && form.data.unit" class="text-sm">
        Se verá como:
        <strong>{{ form.data.name }} de {{ form.data.quantity }} {{ form.data.unit }}</strong>
      </p>
    </form>
    <template #footer>
      <BaseButton variant="outline" @click="formOpen = false">Cancelar</BaseButton>
      <BaseButton type="submit" form="presentation-form" :loading="form.processing.value">
        Guardar
      </BaseButton>
    </template>
  </BaseModal>

  <ConfirmModal
    :open="toDelete !== null"
    :message="`¿Eliminar «${toDelete?.label}»? Esta acción no se puede deshacer.`"
    :loading="deleting"
    @update:open="(open) => !open && (toDelete = null)"
    @confirm="remove"
  />
</template>
