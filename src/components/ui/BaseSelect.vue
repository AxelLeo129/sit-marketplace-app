<script setup lang="ts">
/**
 * Lista desplegable con etiqueta y mensaje de error.
 */
import { useId } from 'vue'

export interface SelectOption {
  value: string | number
  label: string
}

defineProps<{
  label?: string
  options: SelectOption[]
  /** Texto de la opción vacía; sin él, no se puede dejar sin valor. */
  placeholder?: string
  error?: string
  required?: boolean
}>()

const model = defineModel<string | number | null>()
const id = useId()
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="mb-1 block text-xs font-medium text-content">
      {{ label }}<span v-if="required" class="text-danger"> *</span>
    </label>
    <select
      :id="id"
      v-model="model"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      class="w-full cursor-pointer rounded-md border bg-white px-3 py-2.5 text-heading outline-none focus:shadow-[0_3px_10px_0_rgb(0_0_0_/_0.15)]"
      :class="error ? 'border-danger' : 'border-black/20 focus:border-primary'"
    >
      <option v-if="placeholder !== undefined" :value="null">{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>
  </div>
</template>
