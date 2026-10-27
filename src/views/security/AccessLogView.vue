<script setup lang="ts">
/**
 * Registro de accesos (administrador): inicios de sesión, intentos fallidos,
 * bloqueos y cambios de contraseña, con IP y navegador. Sirve para detectar
 * ataques de contraseña y para saber quién usa el sistema y cuándo.
 */
import { onMounted } from 'vue'
import { Search } from 'lucide-vue-next'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BasePagination from '@/components/ui/BasePagination.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import TableSkeleton from '@/components/ui/TableSkeleton.vue'
import { usePaginatedList } from '@/composables/usePaginatedList'
import {
  authEventDetails,
  authEventTypeLabels,
  type AuthEvent,
  type AuthEventType,
} from '@/types/security'
import { formatDateTime } from '@/utils/format'

type AccessLogFilters = {
  type: AuthEventType | null
  search: string
  ip: string
  from: string
  to: string
}

const list = usePaginatedList<AuthEvent, AccessLogFilters>('/security/auth-events', {
  type: null,
  search: '',
  ip: '',
  from: '',
  to: '',
})

const typeOptions = Object.entries(authEventTypeLabels).map(([value, label]) => ({ value, label }))

onMounted(list.load)

/** "Mozilla/5.0 (Windows NT 10.0; ...) Chrome/130..." → "Chrome · Windows". */
function browserSummary(userAgent: string | null): string {
  if (!userAgent) return '—'
  const browser =
    ['Edg', 'OPR', 'Chrome', 'Firefox', 'Safari'].find((name) => userAgent.includes(`${name}/`)) ??
    'Otro'
  const os =
    ['Windows', 'Android', 'iPhone', 'Mac OS', 'Linux'].find((name) => userAgent.includes(name)) ??
    ''
  const names: Record<string, string> = { Edg: 'Edge', OPR: 'Opera', 'Mac OS': 'macOS' }
  return [names[browser] ?? browser, names[os] ?? os].filter(Boolean).join(' · ')
}

/** Filtra por la IP de una fila (para ver todo lo que vino de ahí). */
function filterByIp(ip: string | null): void {
  if (ip) list.filters.ip = ip
}
</script>

<template>
  <h2 class="mb-2 text-2xl">Registro de accesos</h2>
  <p class="mb-6 text-sm">
    Inicios de sesión, intentos fallidos, bloqueos y cambios de contraseña de los últimos 12 meses.
  </p>

  <div class="mb-4 grid gap-4 rounded-lg bg-white p-5 shadow-card md:grid-cols-5">
    <BaseInput
      v-model="list.filters.search"
      placeholder="Usuario, correo o colegiado"
      :icon="Search"
      class="md:col-span-2"
    />
    <BaseSelect
      v-model="list.filters.type"
      :options="typeOptions"
      placeholder="Todos los eventos"
    />
    <BaseInput v-model="list.filters.from" type="date" label="Desde" />
    <BaseInput v-model="list.filters.to" type="date" label="Hasta" />
    <div v-if="list.filters.ip" class="flex items-center gap-2 text-sm md:col-span-5">
      Solo la IP <strong class="text-heading">{{ list.filters.ip }}</strong>
      <button
        type="button"
        class="cursor-pointer text-primary hover:underline"
        @click="list.filters.ip = ''"
      >
        Quitar filtro
      </button>
    </div>
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
          <th>Fecha</th>
          <th>Evento</th>
          <th>Usuario</th>
          <th>IP</th>
          <th>Navegador</th>
        </tr>
      </thead>
      <tbody>
        <TableSkeleton v-if="list.loading.value && list.items.value.length === 0" :columns="5" />
        <tr v-for="event in list.items.value" :key="event.id">
          <td class="whitespace-nowrap">{{ formatDateTime(event.created_at) }}</td>
          <td>
            <BaseBadge :variant="event.is_warning ? 'danger' : 'muted'">
              {{ event.type_label }}
            </BaseBadge>
            <p v-if="event.detail" class="mt-1 text-xs">
              {{ authEventDetails[event.detail] ?? event.detail }}
            </p>
          </td>
          <td>
            <template v-if="event.user">
              <p class="font-medium text-heading">{{ event.user.name }}</p>
              <p class="text-xs">{{ event.user.role_label }}</p>
            </template>
            <p v-else class="text-heading">{{ event.login ?? '—' }}</p>
          </td>
          <td>
            <button
              v-if="event.ip_address"
              type="button"
              class="cursor-pointer font-mono text-xs hover:text-primary hover:underline"
              :title="`Ver todo lo que vino de ${event.ip_address}`"
              @click="filterByIp(event.ip_address)"
            >
              {{ event.ip_address }}
            </button>
            <span v-else>—</span>
          </td>
          <td class="whitespace-nowrap" :title="event.user_agent ?? ''">
            {{ browserSummary(event.user_agent) }}
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="!list.loading.value && list.items.value.length === 0" class="py-8 text-center">
      No hay eventos con esos filtros.
    </p>
  </div>

  <BasePagination v-if="list.meta.value" :meta="list.meta.value" @change="list.goToPage" />
</template>
