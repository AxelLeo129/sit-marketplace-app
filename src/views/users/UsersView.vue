<script setup lang="ts">
/**
 * Usuarios. El administrador ve y gestiona a todos; el visitador, solo a sus médicos.
 */
import { computed, onMounted, ref } from 'vue'
import { Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'
import ConfirmModal from '@/components/ConfirmModal.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import TableSkeleton from '@/components/ui/TableSkeleton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BasePagination from '@/components/ui/BasePagination.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { usePaginatedList } from '@/composables/usePaginatedList'
import { api, ApiError } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import type { Collection } from '@/types/api'
import { roleLabels, type Category, type User } from '@/types/user'
import UserFormModal from './components/UserFormModal.vue'

type UserFilters = {
  search: string
  role: string | null
  is_active: string | null
}

const auth = useAuthStore()
const toast = useToastStore()
const isAdmin = computed(() => auth.hasRole('admin'))

const list = usePaginatedList<User, UserFilters>('/users', {
  search: '',
  role: null,
  is_active: null,
})
const categories = ref<Category[]>([])

const roleOptions = Object.entries(roleLabels).map(([value, label]) => ({ value, label }))
const statusOptions = [
  { value: '1', label: 'Activos' },
  { value: '0', label: 'Inactivos' },
]

const formOpen = ref(false)
const editing = ref<User | null>(null)
const toDelete = ref<User | null>(null)
const deleting = ref(false)

onMounted(async () => {
  await list.load()
  categories.value = (await api.get<Collection<Category>>('/categories')).data
})

function openForm(user: User | null = null): void {
  editing.value = user
  formOpen.value = true
}

async function remove(): Promise<void> {
  if (!toDelete.value) return

  deleting.value = true
  try {
    await api.delete(`/users/${toDelete.value.id}`)
    toast.success(`Se eliminó a ${toDelete.value.name}.`)
    await list.load()
  } catch (error) {
    toast.error(error instanceof ApiError ? error.message : 'No se pudo eliminar.')
  } finally {
    deleting.value = false
    toDelete.value = null
  }
}
</script>

<template>
  <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <h2 class="text-2xl">{{ isAdmin ? 'Usuarios' : 'Mis médicos' }}</h2>
    <BaseButton @click="openForm()">
      <Plus class="size-4" /> {{ isAdmin ? 'Agregar usuario' : 'Agregar médico' }}
    </BaseButton>
  </div>

  <div class="mb-4 grid gap-4 rounded-lg bg-white p-5 shadow-card md:grid-cols-4">
    <BaseInput
      v-model="list.filters.search"
      placeholder="Buscar por nombre, correo o colegiado"
      :icon="Search"
      class="md:col-span-2"
    />
    <BaseSelect
      v-if="isAdmin"
      v-model="list.filters.role"
      :options="roleOptions"
      placeholder="Todos los roles"
    />
    <BaseSelect v-model="list.filters.is_active" :options="statusOptions" placeholder="Todos" />
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
          <th>Usuario</th>
          <th>Rol</th>
          <th>Colegiado</th>
          <th v-if="isAdmin">Visitador</th>
          <th>Estado</th>
          <th class="text-right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <TableSkeleton
          v-if="list.loading.value && list.items.value.length === 0"
          :columns="isAdmin ? 6 : 5"
        />
        <tr v-for="user in list.items.value" :key="user.id">
          <td>
            <div class="flex items-center gap-3">
              <UserAvatar :name="user.name" :src="user.avatar_url" size="size-9" />
              <div>
                <p class="font-medium text-heading">{{ user.name }}</p>
                <p class="text-xs">{{ user.email }}</p>
              </div>
            </div>
          </td>
          <td>
            <BaseBadge>{{ user.role_label }}</BaseBadge>
          </td>
          <td>{{ user.collegiate_number ?? '—' }}</td>
          <td v-if="isAdmin">{{ user.sales_rep?.name ?? '—' }}</td>
          <td>
            <BaseBadge :variant="user.is_active ? 'success' : 'muted'">
              {{ user.is_active ? 'Activo' : 'Inactivo' }}
            </BaseBadge>
          </td>
          <td class="text-right whitespace-nowrap">
            <button
              type="button"
              class="cursor-pointer p-1 hover:text-primary"
              :aria-label="`Editar a ${user.name}`"
              @click="openForm(user)"
            >
              <Pencil class="size-4" />
            </button>
            <!-- Solo el administrador elimina, y nunca a sí mismo. -->
            <button
              v-if="isAdmin && user.id !== auth.user?.id"
              type="button"
              class="cursor-pointer p-1 hover:text-danger"
              :aria-label="`Eliminar a ${user.name}`"
              @click="toDelete = user"
            >
              <Trash2 class="size-4" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="!list.loading.value && list.items.value.length === 0" class="py-8 text-center">
      No se encontraron usuarios.
    </p>
  </div>

  <BasePagination v-if="list.meta.value" :meta="list.meta.value" @change="list.goToPage" />

  <UserFormModal
    v-model:open="formOpen"
    :user="editing"
    :categories="categories"
    @saved="list.load"
  />

  <ConfirmModal
    :open="toDelete !== null"
    :message="`¿Eliminar a ${toDelete?.name}? Se cerrarán sus sesiones y ya no podrá ingresar.`"
    :loading="deleting"
    @update:open="(open) => !open && (toDelete = null)"
    @confirm="remove"
  />
</template>
