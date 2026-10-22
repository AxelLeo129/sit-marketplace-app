<script setup lang="ts">
/**
 * Detalle de un pedido. Lo que se ve depende del rol (la API decide qué montos manda):
 * todos ven precios y totales; facturación además neto e IVA; el administrador,
 * costo, margen y comisiones.
 */
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  ArrowLeft,
  MapPin,
  Navigation,
  PackageCheck,
  PackageX,
  Phone,
  ReceiptText,
  Truck,
  XCircle,
} from 'lucide-vue-next'
import ConfirmModal from '@/components/ConfirmModal.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import { api, ApiError } from '@/services/api'
import { useToastStore } from '@/stores/toast'
import type { Resource } from '@/types/api'
import { orderStatusVariants, type Order } from '@/types/order'
import { formatDateTime, formatMoney } from '@/utils/format'
import AssignCourierModal from './components/AssignCourierModal.vue'
import DeliveryResultModal from './components/DeliveryResultModal.vue'
import InvoiceModal from './components/InvoiceModal.vue'

const props = defineProps<{ id: string }>()

const router = useRouter()
const toast = useToastStore()
const order = ref<Order | null>(null)
const cancelOpen = ref(false)
const cancelling = ref(false)

// Pasos del flujo facturación → despacho → entrega.
const invoiceOpen = ref(false)
const assignOpen = ref(false)
const startOpen = ref(false)
const starting = ref(false)
const resultOpen = ref(false)
const result = ref<'delivered' | 'failed'>('delivered')

/** Enlace de Google Maps con la dirección de entrega, para el mensajero. */
const mapsUrl = computed(() =>
  order.value
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.value.shipping_address.full_address)}`
    : '',
)

/** Si ya tenía factura (p. ej. entrega fallida), hay que anularla fuera del sistema. */
const cancelMessage = computed(() => {
  if (!order.value) return ''
  const base = `¿Cancelar el pedido No. ${order.value.id}? Las existencias regresan al inventario y la receta queda cancelada.`
  return order.value.invoice.number
    ? `${base} La factura ${order.value.invoice.number} debe anularse fuera del sistema.`
    : base
})

/** Actualiza el pedido con la respuesta de la API y avisa. */
function updated(next: Order, message: string): void {
  order.value = next
  toast.success(message)
}

function openResult(value: 'delivered' | 'failed'): void {
  result.value = value
  resultOpen.value = true
}

async function startDelivery(): Promise<void> {
  starting.value = true
  try {
    const response = await api.post<Resource<Order>>(`/orders/${props.id}/start-delivery`)
    updated(response.data, 'Pedido en ruta.')
  } catch (error) {
    toast.error(error instanceof ApiError ? error.message : 'No se pudo actualizar el pedido.')
  } finally {
    starting.value = false
    startOpen.value = false
  }
}

/** La API solo manda estos montos a quien puede verlos. */
const showTaxes = computed(() => order.value?.items[0]?.vat_amount !== undefined)
const showFinancials = computed(() => order.value?.items[0]?.gross_margin !== undefined)

const totals = computed(() => {
  const items = order.value?.items ?? []
  const sum = (pick: (item: (typeof items)[number]) => string | undefined) =>
    items.reduce((total, item) => total + Number(pick(item) ?? 0), 0)

  const margin = sum((item) => item.gross_margin)
  const commissions = items.reduce(
    (total, item) =>
      total +
      (item.commissions ?? []).reduce((acc, commission) => acc + Number(commission.amount), 0),
    0,
  )
  return {
    net: sum((item) => item.net_amount),
    vat: sum((item) => item.vat_amount),
    margin,
    commissions,
  }
})

onMounted(async () => {
  try {
    order.value = (await api.get<Resource<Order>>(`/orders/${props.id}`)).data
  } catch (error) {
    toast.error(error instanceof ApiError ? error.message : 'No se pudo cargar el pedido.')
    await router.replace({ name: 'orders' })
  }
})

async function cancel(): Promise<void> {
  cancelling.value = true
  try {
    order.value = (await api.post<Resource<Order>>(`/orders/${props.id}/cancel`)).data
    toast.success('Pedido cancelado. Las existencias regresaron al inventario.')
  } catch (error) {
    toast.error(error instanceof ApiError ? error.message : 'No se pudo cancelar.')
  } finally {
    cancelling.value = false
    cancelOpen.value = false
  }
}
</script>

<template>
  <div v-if="!order" class="h-96 animate-pulse rounded-lg bg-white shadow-card" />

  <template v-else>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <RouterLink
          :to="{ name: 'orders' }"
          class="mb-2 inline-flex items-center gap-2 hover:text-primary"
        >
          <ArrowLeft class="size-4" /> Pedidos
        </RouterLink>
        <h2 class="flex flex-wrap items-center gap-3 text-2xl">
          Pedido No. {{ order.id }}
          <BaseBadge :variant="orderStatusVariants[order.status]">{{
            order.status_label
          }}</BaseBadge>
        </h2>
        <p class="text-sm">
          Creado el {{ formatDateTime(order.created_at) }} por {{ order.created_by.name }}
          <template v-if="order.prescription_id">
            · Receta
            <RouterLink
              :to="{ name: 'prescription', params: { id: order.prescription_id } }"
              class="text-primary hover:underline"
            >
              No. {{ order.prescription_id }}
            </RouterLink>
          </template>
        </p>
      </div>

      <!-- Acciones del paso actual según el rol (bloque `can` de la API). -->
      <div class="flex flex-wrap gap-3">
        <BaseButton v-if="order.can.cancel" variant="outline" @click="cancelOpen = true">
          <XCircle class="size-4" /> Cancelar pedido
        </BaseButton>
        <BaseButton v-if="order.can.invoice" @click="invoiceOpen = true">
          <ReceiptText class="size-4" /> Facturar
        </BaseButton>
        <BaseButton v-if="order.can.assign" @click="assignOpen = true">
          <Truck class="size-4" />
          {{ order.delivery.courier ? 'Reasignar mensajero' : 'Asignar mensajero' }}
        </BaseButton>
        <BaseButton v-if="order.can.start_delivery" @click="startOpen = true">
          <Navigation class="size-4" /> Salir a ruta
        </BaseButton>
        <template v-if="order.can.complete_delivery">
          <BaseButton variant="danger" @click="openResult('failed')">
            <PackageX class="size-4" /> No se pudo entregar
          </BaseButton>
          <BaseButton variant="success" @click="openResult('delivered')">
            <PackageCheck class="size-4" /> Entregado
          </BaseButton>
        </template>
      </div>
    </div>

    <div class="mb-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <BaseCard title="Cliente">
        <p class="font-semibold text-heading">{{ order.customer.name }}</p>
        <a
          :href="`tel:${order.customer.phone}`"
          class="inline-flex items-center gap-1 text-primary hover:underline"
        >
          <Phone class="size-3.5" /> {{ order.customer.phone }}
        </a>
        <p v-if="order.customer.email">{{ order.customer.email }}</p>
      </BaseCard>

      <BaseCard title="Pago">
        <p class="font-semibold text-heading">{{ order.payment.method_label }}</p>
        <template v-if="order.payment.method === 'card'">
          <p>{{ order.payment.cardholder_name }} · **** {{ order.payment.card_last_four }}</p>
          <p>Autorización {{ order.payment.reference }}</p>
        </template>
        <p class="mt-2 text-xl font-semibold text-primary">{{ formatMoney(order.total) }}</p>
      </BaseCard>

      <BaseCard title="Facturación">
        <p>NIT {{ order.invoice.tax_id ?? order.customer.tax_id }}</p>
        <p class="text-sm">{{ order.billing_address.full_address }}</p>
        <template v-if="order.invoice.number">
          <p class="mt-2 font-semibold text-heading">Factura {{ order.invoice.number }}</p>
          <p v-if="order.invoice.invoiced_at" class="text-sm">
            {{ formatDateTime(order.invoice.invoiced_at) }}
            <template v-if="order.invoice.invoiced_by">
              · {{ order.invoice.invoiced_by.name }}</template
            >
          </p>
        </template>
        <p v-else class="mt-2 text-sm">Sin facturar.</p>
      </BaseCard>

      <BaseCard title="Entrega">
        <p class="text-sm">{{ order.shipping_address.full_address }}</p>
        <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <a
            :href="mapsUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <MapPin class="size-3.5" /> Ver en mapa
          </a>
          <a
            v-if="order.shipping_address.phone"
            :href="`tel:${order.shipping_address.phone}`"
            class="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <Phone class="size-3.5" /> {{ order.shipping_address.phone }}
          </a>
        </div>
        <dl class="mt-2 space-y-1 text-sm">
          <div v-if="order.delivery.courier">
            <dt class="inline font-semibold text-heading">Mensajero:</dt>
            <dd class="inline">{{ order.delivery.courier.name }}</dd>
          </div>
          <div v-if="order.delivery.dispatched_at">
            <dt class="inline font-semibold text-heading">Salió:</dt>
            <dd class="inline">{{ formatDateTime(order.delivery.dispatched_at) }}</dd>
          </div>
          <div v-if="order.delivery.delivered_at">
            <dt class="inline font-semibold text-heading">Entregado:</dt>
            <dd class="inline">
              {{ formatDateTime(order.delivery.delivered_at) }} a {{ order.delivery.received_by }}
            </dd>
          </div>
          <div v-if="order.delivery.notes">
            <dt class="inline font-semibold text-heading">Notas:</dt>
            <dd class="inline">{{ order.delivery.notes }}</dd>
          </div>
        </dl>
      </BaseCard>
    </div>

    <BaseCard title="Medicamentos">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-black/10 text-xs text-heading uppercase">
              <th class="py-2 pr-3">Medicamento</th>
              <th class="py-2 pr-3 text-right">Cant.</th>
              <th class="py-2 pr-3 text-right">Precio</th>
              <th class="py-2 pr-3 text-right">Subtotal</th>
              <template v-if="showTaxes">
                <th class="py-2 pr-3 text-right">Neto</th>
                <th class="py-2 pr-3 text-right">IVA</th>
              </template>
              <template v-if="showFinancials">
                <th class="py-2 pr-3 text-right">Costo unit.</th>
                <th class="py-2 pr-3 text-right">Cargo tarjeta</th>
                <th class="py-2 pr-3 text-right">Margen</th>
                <th class="py-2">Comisiones</th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in order.items"
              :key="item.id"
              class="border-b border-black/5 align-top"
            >
              <td class="py-3 pr-3">
                <p class="font-medium text-heading">{{ item.product.name }}</p>
                <p v-if="item.product.presentation" class="text-xs">
                  {{ item.product.presentation.label }}
                </p>
                <BaseBadge
                  :variant="item.origin === 'prescribed' ? 'primary' : 'info'"
                  class="mt-1"
                >
                  {{ item.origin === 'prescribed' ? 'Recetado' : 'Agregado' }}
                </BaseBadge>
                <span v-if="item.purchase_number" class="ml-1 text-xs">
                  Compra No. {{ item.purchase_number }}
                </span>
              </td>
              <td class="py-3 pr-3 text-right">{{ item.quantity }}</td>
              <td class="py-3 pr-3 text-right whitespace-nowrap">
                {{ formatMoney(item.unit_price) }}
              </td>
              <td class="py-3 pr-3 text-right whitespace-nowrap">
                {{ formatMoney(item.line_total) }}
              </td>
              <template v-if="showTaxes">
                <td class="py-3 pr-3 text-right whitespace-nowrap">
                  {{ formatMoney(item.net_amount ?? 0) }}
                </td>
                <td class="py-3 pr-3 text-right whitespace-nowrap">
                  {{ formatMoney(item.vat_amount ?? 0) }}
                </td>
              </template>
              <template v-if="showFinancials">
                <td class="py-3 pr-3 text-right whitespace-nowrap">
                  {{ formatMoney(item.unit_cost ?? 0) }}
                </td>
                <td class="py-3 pr-3 text-right whitespace-nowrap">
                  {{ formatMoney(item.card_fee_amount ?? 0) }}
                </td>
                <td class="py-3 pr-3 text-right whitespace-nowrap">
                  {{ formatMoney(item.gross_margin ?? 0) }}
                </td>
                <td class="py-3">
                  <ul class="space-y-1 text-xs">
                    <li v-for="commission in item.commissions" :key="commission.role">
                      {{ commission.role_label }} {{ Number(commission.rate) }} %:
                      <strong>{{ formatMoney(commission.amount) }}</strong>
                      <span class="block text-content/70">
                        {{ commission.beneficiary?.name ?? 'Sin asignar' }}
                      </span>
                    </li>
                    <li v-if="!item.commissions?.length">Sin comisiones</li>
                  </ul>
                </td>
              </template>
            </tr>
          </tbody>
          <tfoot class="font-semibold text-heading">
            <tr>
              <td class="pt-3 pr-3" colspan="3">Total</td>
              <td class="pt-3 pr-3 text-right whitespace-nowrap">{{ formatMoney(order.total) }}</td>
              <template v-if="showTaxes">
                <td class="pt-3 pr-3 text-right whitespace-nowrap">
                  {{ formatMoney(totals.net) }}
                </td>
                <td class="pt-3 pr-3 text-right whitespace-nowrap">
                  {{ formatMoney(totals.vat) }}
                </td>
              </template>
              <template v-if="showFinancials">
                <td colspan="2" />
                <td class="pt-3 pr-3 text-right whitespace-nowrap">
                  {{ formatMoney(totals.margin) }}
                </td>
                <td class="pt-3 whitespace-nowrap">{{ formatMoney(totals.commissions) }}</td>
              </template>
            </tr>
          </tfoot>
        </table>
      </div>
    </BaseCard>

    <ConfirmModal
      v-model:open="cancelOpen"
      title="Cancelar pedido"
      :message="cancelMessage"
      confirm-label="Cancelar pedido"
      :loading="cancelling"
      @confirm="cancel"
    />
    <ConfirmModal
      v-model:open="startOpen"
      title="Salir a ruta"
      :message="`¿Sales a entregar el pedido No. ${order.id} a ${order.shipping_address.full_address}?`"
      confirm-label="Salir a ruta"
      variant="primary"
      :loading="starting"
      @confirm="startDelivery"
    />
    <InvoiceModal
      v-model:open="invoiceOpen"
      :order="order"
      @saved="(next) => updated(next, `Pedido facturado con la factura ${next.invoice.number}.`)"
    />
    <AssignCourierModal
      v-model:open="assignOpen"
      :order="order"
      @saved="(next) => updated(next, `Pedido asignado a ${next.delivery.courier?.name}.`)"
    />
    <DeliveryResultModal
      v-model:open="resultOpen"
      :order="order"
      :result="result"
      @saved="
        (next) =>
          updated(
            next,
            result === 'delivered' ? 'Entrega confirmada.' : 'Se reportó la entrega fallida.',
          )
      "
    />
  </template>
</template>
