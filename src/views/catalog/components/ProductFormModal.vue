<script setup lang="ts">
/**
 * Crear o editar un producto, con su imagen y categorías.
 * La imagen se sube después de guardar el producto (necesita su id).
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ImageOff } from 'lucide-vue-next'
import ImagePicker from '@/components/ImagePicker.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCheckbox from '@/components/ui/BaseCheckbox.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSelect, { type SelectOption } from '@/components/ui/BaseSelect.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import { useForm } from '@/composables/useForm'
import { api, ApiError } from '@/services/api'
import { useToastStore } from '@/stores/toast'
import type { Resource } from '@/types/api'
import type { Category, Product } from '@/types/catalog'

const props = defineProps<{
  /** Producto a editar; null para crear uno nuevo. */
  product: Product | null
  categories: Category[]
  labOptions: SelectOption[]
  presentationOptions: SelectOption[]
}>()
const emit = defineEmits<{ saved: [] }>()
const open = defineModel<boolean>('open', { required: true })

const toast = useToastStore()

const emptyProduct = {
  name: '',
  presentation_id: null as number | null,
  lab_id: null as number | null,
  price: '' as string | number,
  cost: '' as string | number,
  stock: 0 as number | string,
  warehouse: '',
  is_active: true,
  is_regulated: false,
  description: '',
  observations: '',
  category_ids: [] as number[],
}
const form = useForm(emptyProduct)

// Imagen elegida (se sube al guardar) o marcada para quitar.
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)
const removeImage = ref(false)

const currentImage = computed(
  () => imagePreview.value ?? (removeImage.value ? null : (props.product?.image_url ?? null)),
)

// Al abrir, carga los datos del producto (o deja el formulario vacío).
watch(open, (isOpen) => {
  if (!isOpen) return

  form.reset()
  clearImage()
  removeImage.value = false

  const product = props.product
  if (product) {
    Object.assign(form.data, {
      name: product.name,
      presentation_id: product.presentation.id,
      lab_id: product.lab.id,
      price: product.price,
      cost: product.cost ?? '',
      stock: product.stock,
      warehouse: product.warehouse ?? '',
      is_active: product.is_active,
      is_regulated: product.is_regulated,
      description: product.description ?? '',
      observations: product.observations ?? '',
      category_ids: product.categories.map((category) => category.id),
    })
  }
})

function selectImage(file: File): void {
  clearImage()
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
  removeImage.value = false
}

function clearImage(): void {
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value)
  imageFile.value = null
  imagePreview.value = null
}

onBeforeUnmount(clearImage)

async function save(): Promise<void> {
  const response = await form.submit(() => {
    const body = { ...form.data, warehouse: form.data.warehouse || null }
    return props.product
      ? api.put<Resource<Product>>(`/products/${props.product.id}`, body)
      : api.post<Resource<Product>>('/products', body)
  })

  if (!response) return

  await saveImage(response.data.id)
  open.value = false
  toast.success(props.product ? 'Producto actualizado.' : 'Producto agregado.')
  emit('saved')
}

/** Sube la imagen nueva o quita la actual. Si falla, el producto ya quedó guardado. */
async function saveImage(productId: number): Promise<void> {
  try {
    if (imageFile.value) {
      const body = new FormData()
      body.append('image', imageFile.value)
      await api.post(`/products/${productId}/image`, body)
    } else if (removeImage.value) {
      await api.delete(`/products/${productId}/image`)
    }
  } catch (error) {
    toast.error(
      `El producto se guardó, pero no la imagen: ${error instanceof ApiError ? error.message : 'error inesperado'}`,
    )
  }
}
</script>

<template>
  <BaseModal v-model:open="open" :title="product ? 'Editar producto' : 'Nuevo producto'" size="lg">
    <form id="product-form" class="space-y-5" novalidate @submit.prevent="save">
      <BaseAlert v-if="form.message.value" variant="danger">{{ form.message.value }}</BaseAlert>

      <div class="flex flex-wrap items-center gap-5">
        <img
          v-if="currentImage"
          :src="currentImage"
          alt="Imagen del producto"
          class="size-24 rounded-md object-cover"
        />
        <span v-else class="grid size-24 place-items-center rounded-md bg-black/5">
          <ImageOff class="size-6 text-content/50" />
        </span>
        <div class="space-y-2">
          <ImagePicker label="Elegir imagen" @select="selectImage" />
          <button
            v-if="currentImage"
            type="button"
            class="cursor-pointer text-sm text-danger hover:underline"
            @click="((removeImage = true), clearImage())"
          >
            Quitar imagen
          </button>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <BaseInput
          v-model="form.data.name"
          label="Nombre"
          class="md:col-span-2"
          :error="form.errors.value.name"
          required
        />
        <BaseSelect
          v-model="form.data.presentation_id"
          label="Presentación"
          :options="presentationOptions"
          placeholder="Seleccione"
          :error="form.errors.value.presentation_id"
          required
        />
        <BaseSelect
          v-model="form.data.lab_id"
          label="Laboratorio"
          :options="labOptions"
          placeholder="Seleccione"
          :error="form.errors.value.lab_id"
          required
        />
        <BaseInput
          v-model="form.data.price"
          label="Precio de venta (con IVA)"
          type="number"
          min="0"
          step="0.01"
          :error="form.errors.value.price"
          required
        />
        <BaseInput
          v-model="form.data.cost"
          label="Costo"
          type="number"
          min="0"
          step="0.01"
          :error="form.errors.value.cost"
          required
        />
        <BaseInput
          v-model="form.data.stock"
          label="Existencias"
          type="number"
          :error="form.errors.value.stock"
          required
        />
        <BaseInput
          v-model="form.data.warehouse"
          label="Bodega"
          :error="form.errors.value.warehouse"
        />
        <BaseTextarea
          v-model="form.data.description"
          label="Descripción"
          class="md:col-span-2"
          :error="form.errors.value.description"
        />
        <BaseTextarea
          v-model="form.data.observations"
          label="Observaciones"
          class="md:col-span-2"
          :error="form.errors.value.observations"
        />
      </div>

      <div class="flex flex-wrap gap-6">
        <BaseCheckbox v-model="form.data.is_active" label="Activo (visible para vender)" />
        <BaseCheckbox v-model="form.data.is_regulated" label="Medicamento controlado" />
      </div>

      <fieldset>
        <legend class="mb-2 font-medium text-heading">Categorías</legend>
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
    </form>

    <template #footer>
      <BaseButton variant="outline" @click="open = false">Cancelar</BaseButton>
      <BaseButton type="submit" form="product-form" :loading="form.processing.value">
        Guardar
      </BaseButton>
    </template>
  </BaseModal>
</template>
