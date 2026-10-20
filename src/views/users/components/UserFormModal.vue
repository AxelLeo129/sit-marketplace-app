<script setup lang="ts">
/**
 * Crear o editar un usuario.
 *
 * - Administrador: cualquier rol, estado activo y visitador del médico.
 * - Visitador: solo médicos; la API los asigna a él automáticamente.
 * - Nadie cambia su propio rol ni se desactiva a sí mismo.
 */
import { computed, ref, watch } from 'vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { useForm } from '@/composables/useForm'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import type { Collection } from '@/types/api'
import { roleLabels, type Category, type Role, type User } from '@/types/user'

const props = defineProps<{
  /** Usuario a editar; null para crear uno nuevo. */
  user: User | null
  categories: Category[]
}>()
const emit = defineEmits<{ saved: [] }>()
const open = defineModel<boolean>('open', { required: true })

const auth = useAuthStore()
const toast = useToastStore()
const isAdmin = computed(() => auth.hasRole('admin'))
const isSelf = computed(() => props.user?.id === auth.user?.id)

const roleOptions = Object.entries(roleLabels).map(([value, label]) => ({ value, label }))
const salesReps = ref<{ value: number; label: string }[]>([])

const form = useForm({
  name: '',
  email: '',
  password: '',
  phone: '',
  birth_date: '',
  role: 'doctor' as Role,
  is_active: true,
  collegiate_number: '',
  sales_rep_id: null as number | null,
  clinic_name: '',
  clinic_phone: '',
  clinic_address: '',
  category_ids: [] as number[],
})

// El visitador solo crea médicos.
const isDoctor = computed(() => !isAdmin.value || form.data.role === 'doctor')

watch(open, async (isOpen) => {
  if (!isOpen) return

  form.reset()
  const user = props.user
  if (user) {
    Object.assign(form.data, {
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      birth_date: user.birth_date ?? '',
      role: user.role,
      is_active: user.is_active,
      collegiate_number: user.collegiate_number ?? '',
      sales_rep_id: user.sales_rep?.id ?? null,
      clinic_name: user.doctor_profile?.clinic_name ?? '',
      clinic_phone: user.doctor_profile?.clinic_phone ?? '',
      clinic_address: user.doctor_profile?.clinic_address ?? '',
      category_ids: user.specialties?.map((category) => category.id) ?? [],
    })
  }

  if (isAdmin.value && salesReps.value.length === 0) {
    const response = await api.get<Collection<User>>('/users?role=sales_rep&per_page=100')
    salesReps.value = response.data.map((rep) => ({ value: rep.id, label: rep.name }))
  }
})

/**
 * Datos a enviar. La API rechaza los campos de médico en otros roles,
 * y el rol o el estado propios, así que solo se envía lo que aplica.
 */
function payload(): Record<string, unknown> {
  const data = form.data
  const body: Record<string, unknown> = {
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    birth_date: data.birth_date || null,
  }

  // Al editar, la contraseña vacía significa "no cambiarla".
  if (data.password || !props.user) body.password = data.password

  if (isAdmin.value && !isSelf.value) {
    body.role = data.role
    body.is_active = data.is_active
  }

  if (isDoctor.value) {
    body.collegiate_number = data.collegiate_number
    body.doctor_profile = {
      clinic_name: data.clinic_name || null,
      clinic_phone: data.clinic_phone || null,
      clinic_address: data.clinic_address || null,
    }
    body.category_ids = data.category_ids
    if (isAdmin.value) body.sales_rep_id = data.sales_rep_id
  }

  return body
}

async function save(): Promise<void> {
  const saved = await form.submit(() =>
    props.user ? api.put(`/users/${props.user.id}`, payload()) : api.post('/users', payload()),
  )

  if (saved) {
    open.value = false
    toast.success(props.user ? 'Usuario actualizado.' : 'Usuario creado.')
    emit('saved')
  }
}
</script>

<template>
  <BaseModal v-model:open="open" :title="user ? 'Editar usuario' : 'Nuevo usuario'" size="lg">
    <form id="user-form" class="space-y-5" novalidate @submit.prevent="save">
      <BaseAlert v-if="form.message.value" variant="danger">{{ form.message.value }}</BaseAlert>

      <div class="grid gap-4 md:grid-cols-2">
        <BaseInput
          v-model="form.data.name"
          label="Nombre"
          :error="form.errors.value.name"
          required
        />
        <BaseInput
          v-model="form.data.email"
          label="Correo"
          type="email"
          autocomplete="off"
          :error="form.errors.value.email"
          required
        />
        <BaseInput
          v-model="form.data.password"
          :label="user ? 'Contraseña nueva (opcional)' : 'Contraseña'"
          type="password"
          autocomplete="new-password"
          :error="form.errors.value.password"
          :required="!user"
        />
        <BaseInput
          v-model="form.data.phone"
          label="Teléfono"
          type="tel"
          :error="form.errors.value.phone"
        />
        <BaseInput
          v-model="form.data.birth_date"
          label="Fecha de nacimiento"
          type="date"
          :error="form.errors.value.birth_date"
        />
        <BaseSelect
          v-if="isAdmin && !isSelf"
          v-model="form.data.role"
          label="Rol"
          :options="roleOptions"
          :error="form.errors.value.role"
          required
        />
      </div>
      <p class="text-xs">
        La contraseña debe tener mínimo 8 caracteres, con letras y números.
        <template v-if="user">Al cambiarla se cierran las sesiones del usuario.</template>
      </p>

      <BaseCheckbox
        v-if="isAdmin && !isSelf"
        v-model="form.data.is_active"
        label="Activo (si se desactiva, no puede iniciar sesión)"
      />

      <!-- Datos del médico -->
      <template v-if="isDoctor">
        <h5 class="border-t border-black/5 pt-5 font-semibold">Datos del médico</h5>
        <div class="grid gap-4 md:grid-cols-2">
          <BaseInput
            v-model="form.data.collegiate_number"
            label="No. de colegiado"
            :error="form.errors.value.collegiate_number"
            required
          />
          <BaseSelect
            v-if="isAdmin"
            v-model="form.data.sales_rep_id"
            label="Visitador"
            :options="salesReps"
            placeholder="Sin visitador"
            :error="form.errors.value.sales_rep_id"
          />
          <BaseInput v-model="form.data.clinic_name" label="Clínica" />
          <BaseInput v-model="form.data.clinic_phone" label="Teléfono de la clínica" type="tel" />
          <BaseInput
            v-model="form.data.clinic_address"
            label="Dirección de la clínica"
            class="md:col-span-2"
          />
        </div>

        <fieldset>
          <legend class="mb-2 font-medium text-heading">Especialidades</legend>
          <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <label
              v-for="category in categories"
              :key="category.id"
              class="inline-flex cursor-pointer items-center gap-2"
            >
              <input
                v-model="form.data.category_ids"
                type="checkbox"
                :value="category.id"
                class="size-4 cursor-pointer accent-primary"
              />
              {{ category.name }}
            </label>
          </div>
        </fieldset>
      </template>
    </form>

    <template #footer>
      <BaseButton variant="outline" @click="open = false">Cancelar</BaseButton>
      <BaseButton type="submit" form="user-form" :loading="form.processing.value">
        Guardar
      </BaseButton>
    </template>
  </BaseModal>
</template>
