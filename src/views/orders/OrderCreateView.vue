<script setup lang="ts">
/**
 * El call-center convierte una receta en pedido:
 * 1. busca o registra al cliente, 2. elige direcciones, 3. ajusta los medicamentos
 * (los recetados más los que agregue), 4. elige la forma de pago y confirma.
 *
 * Los totales en pantalla son una vista previa: precios, IVA y comisiones los calcula la API.
 */
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ArrowLeft, Pencil, Plus, Search, Trash2, TriangleAlert } from 'lucide-vue-next'
import ProductSearch from '@/components/ProductSearch.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useForm } from '@/composables/useForm'
import { api } from '@/services/api'
import { useToastStore } from '@/stores/toast'
import type { Collection, Resource } from '@/types/api'
import type { Product } from '@/types/catalog'
import {
  paymentMethodLabels,
  type AddressType,
  type Customer,
  type CustomerAddress,
  type Order,
  type PaymentMethod,
} from '@/types/order'
import type { Prescription } from '@/types/prescription'
import { formatMoney } from '@/utils/format'
import AddressFormModal from './components/AddressFormModal.vue'
import CustomerFormModal from './components/CustomerFormModal.vue'

const props = defineProps<{ id: string }>()

const router = useRouter()
const toast = useToastStore()
const prescription = ref<Prescription | null>(null)

// 1. Cliente
const customerSearch = ref('')
const customerResults = ref<Customer[] | null>(null)
const searchingCustomers = ref(false)
const customer = ref<Customer | null>(null)
const customerModalOpen = ref(false)
const editingCustomer = ref(false)

// 2. Direcciones
const billingAddressId = ref<number | null>(null)
const shippingAddressId = ref<number | null>(null)
const addressModalOpen = ref(false)
const addressType = ref<AddressType>('shipping')

const addressGroups = computed(() => [
  { type: 'billing' as const, title: 'Facturación', list: addressesOf('billing') },
  { type: 'shipping' as const, title: 'Entrega', list: addressesOf('shipping') },
])

// 3. Medicamentos
interface Line {
  product: Product
  quantity: number
  prescribed: boolean
}
const lines = ref<Line[]>([])
const selectedIds = computed(() => lines.value.map((line) => line.product.id))
const total = computed(() =>
  lines.value.reduce((sum, line) => sum + Number(line.product.price) * (line.quantity || 0), 0),
)

// 4. Pago
const form = useForm({
  payment_method: 'cash_on_delivery' as PaymentMethod,
  payment_reference: '',
  cardholder_name: '',
  card_last_four: '',
})

onMounted(async () => {
  const { data } = await api.get<Resource<Prescription>>(`/prescriptions/${props.id}`)
  if (!data.can.handle_call) {
    toast.error('Esta receta ya no se puede convertir en pedido.')
    await router.replace({ name: 'prescription', params: { id: data.id } })
    return
  }

  prescription.value = data
  lines.value = data.items.map((item) => ({ product: item.product, quantity: 1, prescribed: true }))

  // Lo más común: el cliente es el paciente, así que se busca por su teléfono.
  customerSearch.value = data.patient_phone
  await searchCustomers()
})

async function searchCustomers(): Promise<void> {
  if (!customerSearch.value.trim()) return

  searchingCustomers.value = true
  try {
    const params = new URLSearchParams({ search: customerSearch.value.trim(), per_page: '10' })
    customerResults.value = (await api.get<Collection<Customer>>(`/customers?${params}`)).data
  } finally {
    searchingCustomers.value = false
  }
}

function addressesOf(type: AddressType): CustomerAddress[] {
  return customer.value?.addresses.filter((address) => address.type === type) ?? []
}

/** Elige al cliente y su primera dirección de cada tipo. */
function selectCustomer(selected: Customer): void {
  customer.value = selected
  customerResults.value = null
  billingAddressId.value = addressesOf('billing')[0]?.id ?? null
  shippingAddressId.value = addressesOf('shipping')[0]?.id ?? null
}

function onCustomerSaved(saved: Customer): void {
  toast.success(editingCustomer.value ? 'Cliente actualizado.' : 'Cliente registrado.')
  selectCustomer(saved)
}

function openCustomerModal(edit: boolean): void {
  editingCustomer.value = edit
  customerModalOpen.value = true
}

function openAddressModal(type: AddressType): void {
  addressType.value = type
  addressModalOpen.value = true
}

function onAddressSaved(address: CustomerAddress): void {
  customer.value?.addresses.push(address)
  if (address.type === 'billing') billingAddressId.value = address.id
  else shippingAddressId.value = address.id
}

function addProduct(product: Product): void {
  lines.value.push({ product, quantity: 1, prescribed: false })
}

function removeLine(index: number): void {
  lines.value.splice(index, 1)
}

async function confirm(): Promise<void> {
  const isCard = form.data.payment_method === 'card'
  const body = {
    prescription_id: Number(props.id),
    customer_id: customer.value?.id,
    billing_address_id: billingAddressId.value,
    shipping_address_id: shippingAddressId.value,
    payment_method: form.data.payment_method,
    // Los datos de tarjeta solo se envían si se paga con tarjeta (la API los rechaza en otro caso).
    ...(isCard && {
      payment_reference: form.data.payment_reference,
      cardholder_name: form.data.cardholder_name,
      card_last_four: form.data.card_last_four,
    }),
    items: lines.value.map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
  }

  const response = await form.submit(() => api.post<Resource<Order>>('/orders', body))
  if (response) {
    toast.success(`Pedido No. ${response.data.id} creado.`)
    await router.push({ name: 'order', params: { id: response.data.id } })
  }
}
</script>

<template>
  <div v-if="!prescription" class="h-96 animate-pulse rounded-lg bg-white shadow-card" />

  <template v-else>
    <RouterLink
      :to="{ name: 'prescription', params: { id: prescription.id } }"
      class="mb-4 inline-flex items-center gap-2 hover:text-primary"
    >
      <ArrowLeft class="size-4" /> Receta No. {{ prescription.id }}
    </RouterLink>
    <h2 class="mb-6 text-2xl">Nuevo pedido</h2>

    <BaseAlert v-if="form.message.value" variant="danger" class="mb-6">
      {{ form.message.value }}
    </BaseAlert>
    <BaseAlert v-if="form.errors.value.prescription_id" variant="danger" class="mb-6">
      {{ form.errors.value.prescription_id }}
    </BaseAlert>

    <div class="grid gap-6 xl:grid-cols-3">
      <div class="space-y-6 xl:col-span-2">
        <!-- 1. Cliente -->
        <BaseCard title="1. Cliente">
          <p class="mb-4 text-sm">
            Paciente: <strong>{{ prescription.patient_name }}</strong> ·
            {{ prescription.patient_phone }} · Dr(a). {{ prescription.doctor.name }}
          </p>

          <div
            v-if="customer"
            class="flex flex-wrap items-start justify-between gap-3 rounded-md bg-primary/5 p-4"
          >
            <div>
              <p class="font-semibold text-heading">{{ customer.name }}</p>
              <p class="text-sm">Tel. {{ customer.phone }} · NIT {{ customer.tax_id }}</p>
              <p v-if="customer.email" class="text-sm">{{ customer.email }}</p>
            </div>
            <div class="flex gap-2">
              <BaseButton variant="flat" @click="openCustomerModal(true)">
                <Pencil class="size-4" /> Editar
              </BaseButton>
              <BaseButton variant="outline" @click="customer = null">Cambiar</BaseButton>
            </div>
          </div>

          <template v-else>
            <form class="flex flex-wrap gap-3" @submit.prevent="searchCustomers">
              <BaseInput
                v-model="customerSearch"
                placeholder="Teléfono, nombre o NIT"
                :icon="Search"
                class="min-w-60 flex-1"
              />
              <BaseButton type="submit" variant="flat" :loading="searchingCustomers"
                >Buscar</BaseButton
              >
              <BaseButton variant="outline" @click="openCustomerModal(false)">
                <Plus class="size-4" /> Nuevo cliente
              </BaseButton>
            </form>

            <ul v-if="customerResults" class="mt-4 space-y-2">
              <li v-if="customerResults.length === 0" class="py-3 text-center text-sm">
                No hay clientes con esos datos. Regístralo con "Nuevo cliente".
              </li>
              <li
                v-for="result in customerResults"
                :key="result.id"
                class="flex items-center justify-between gap-3 rounded-md border border-black/10 px-4 py-3"
              >
                <div>
                  <p class="font-medium text-heading">{{ result.name }}</p>
                  <p class="text-xs">
                    Tel. {{ result.phone }} · NIT {{ result.tax_id }} ·
                    {{ result.addresses.length }} direcciones
                  </p>
                </div>
                <BaseButton variant="flat" @click="selectCustomer(result)">Elegir</BaseButton>
              </li>
            </ul>
          </template>
          <p v-if="form.errors.value.customer_id" class="mt-2 text-xs text-danger">
            {{ form.errors.value.customer_id }}
          </p>
        </BaseCard>

        <!-- 2. Direcciones -->
        <BaseCard v-if="customer" title="2. Direcciones">
          <div class="grid gap-6 md:grid-cols-2">
            <fieldset v-for="group in addressGroups" :key="group.type">
              <legend class="mb-2 font-medium text-heading">{{ group.title }}</legend>
              <p v-if="group.list.length === 0" class="mb-2 text-sm">Sin direcciones.</p>
              <label
                v-for="address in group.list"
                :key="address.id"
                class="mb-2 flex cursor-pointer items-start gap-2 rounded-md border border-black/10 p-3 has-checked:border-primary has-checked:bg-primary/5"
              >
                <input
                  v-if="group.type === 'billing'"
                  v-model="billingAddressId"
                  type="radio"
                  :value="address.id"
                  class="mt-1 accent-primary"
                />
                <input
                  v-else
                  v-model="shippingAddressId"
                  type="radio"
                  :value="address.id"
                  class="mt-1 accent-primary"
                />
                <span class="text-sm">{{ address.full_address }}</span>
              </label>
              <button
                type="button"
                class="inline-flex cursor-pointer items-center gap-1 text-sm text-primary hover:underline"
                @click="openAddressModal(group.type)"
              >
                <Plus class="size-4" /> Agregar dirección
              </button>
              <p
                v-if="form.errors.value[`${group.type}_address_id`]"
                class="mt-1 text-xs text-danger"
              >
                {{ form.errors.value[`${group.type}_address_id`] }}
              </p>
            </fieldset>
          </div>
        </BaseCard>

        <!-- 3. Medicamentos -->
        <BaseCard title="3. Medicamentos">
          <ProductSearch
            :exclude-ids="selectedIds"
            placeholder="Agregar otro medicamento"
            :error="form.errors.value.items"
            class="mb-4"
            @select="addProduct"
          />

          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="border-b border-black/10 text-xs text-heading uppercase">
                  <th class="py-2 pr-3">Medicamento</th>
                  <th class="py-2 pr-3">Precio</th>
                  <th class="w-28 py-2 pr-3">Cantidad</th>
                  <th class="py-2 pr-3 text-right">Subtotal</th>
                  <th class="py-2"><span class="sr-only">Quitar</span></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(line, index) in lines"
                  :key="line.product.id"
                  class="border-b border-black/5 align-top"
                >
                  <td class="py-3 pr-3">
                    <p class="font-medium text-heading">{{ line.product.name }}</p>
                    <p class="text-xs">{{ line.product.presentation.label }}</p>
                    <BaseBadge :variant="line.prescribed ? 'primary' : 'info'" class="mt-1">
                      {{ line.prescribed ? 'Recetado' : 'Agregado' }}
                    </BaseBadge>
                    <p
                      v-if="line.quantity > line.product.stock"
                      class="mt-1 flex items-center gap-1 text-xs text-warning"
                    >
                      <TriangleAlert class="size-3" /> Solo hay {{ line.product.stock }} en
                      existencia.
                    </p>
                    <p
                      v-if="form.errors.value[`items.${index}.product_id`]"
                      class="mt-1 text-xs text-danger"
                    >
                      {{ form.errors.value[`items.${index}.product_id`] }}
                    </p>
                  </td>
                  <td class="py-3 pr-3 whitespace-nowrap">{{ formatMoney(line.product.price) }}</td>
                  <td class="py-3 pr-3">
                    <BaseInput
                      v-model="line.quantity"
                      type="number"
                      min="1"
                      max="999"
                      :error="form.errors.value[`items.${index}.quantity`]"
                    />
                  </td>
                  <td class="py-3 pr-3 text-right whitespace-nowrap">
                    {{ formatMoney(Number(line.product.price) * (line.quantity || 0)) }}
                  </td>
                  <td class="py-3 text-right">
                    <button
                      type="button"
                      class="cursor-pointer p-1 hover:text-danger"
                      :aria-label="`Quitar ${line.product.name}`"
                      @click="removeLine(index)"
                    >
                      <Trash2 class="size-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-if="lines.length === 0" class="py-6 text-center">
              Agrega al menos un medicamento.
            </p>
          </div>
        </BaseCard>
      </div>

      <!-- 4. Pago y resumen -->
      <div class="xl:sticky xl:top-28 xl:self-start">
        <BaseCard title="4. Pago">
          <div class="mb-4 flex flex-col gap-2">
            <label
              v-for="(label, method) in paymentMethodLabels"
              :key="method"
              class="flex cursor-pointer items-center gap-2 rounded-md border border-black/10 p-3 has-checked:border-primary has-checked:bg-primary/5"
            >
              <input
                v-model="form.data.payment_method"
                type="radio"
                :value="method"
                class="accent-primary"
              />
              {{ label }}
            </label>
          </div>

          <div v-if="form.data.payment_method === 'card'" class="mb-4 space-y-3">
            <BaseInput
              v-model="form.data.cardholder_name"
              label="Titular de la tarjeta"
              :error="form.errors.value.cardholder_name"
              required
            />
            <BaseInput
              v-model="form.data.card_last_four"
              label="Últimos 4 dígitos"
              :error="form.errors.value.card_last_four"
              required
            />
            <BaseInput
              v-model="form.data.payment_reference"
              label="No. de autorización"
              :error="form.errors.value.payment_reference"
              required
            />
            <p class="text-xs">
              Nunca se guarda el número completo ni el vencimiento de la tarjeta.
            </p>
          </div>

          <div class="flex items-center justify-between border-t border-black/10 pt-4">
            <span class="font-medium text-heading">Total (con IVA)</span>
            <span class="text-xl font-semibold text-primary">{{ formatMoney(total) }}</span>
          </div>
          <p class="mt-1 mb-4 text-xs">El total final lo confirma el sistema al crear el pedido.</p>

          <BaseButton
            block
            :loading="form.processing.value"
            :disabled="!customer || lines.length === 0"
            @click="confirm"
          >
            Confirmar pedido
          </BaseButton>
        </BaseCard>
      </div>
    </div>

    <CustomerFormModal
      v-model:open="customerModalOpen"
      :customer="editingCustomer ? customer : null"
      :initial="{
        name: prescription.patient_name,
        phone: prescription.patient_phone,
        email: prescription.patient_email,
      }"
      @saved="onCustomerSaved"
    />
    <AddressFormModal
      v-if="customer"
      v-model:open="addressModalOpen"
      :customer-id="customer.id"
      :type="addressType"
      @saved="onAddressSaved"
    />
  </template>
</template>
