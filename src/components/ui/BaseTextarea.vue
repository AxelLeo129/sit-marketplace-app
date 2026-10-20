<script setup lang="ts">
/**
 * Área de texto con etiqueta y mensaje de error.
 */
import { useId } from 'vue'

withDefaults(defineProps<{ label?: string; error?: string; rows?: number }>(), { rows: 3 })

const model = defineModel<string | null>()
const id = useId()
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="mb-1 block text-xs font-medium text-content">
      {{ label }}
    </label>
    <textarea
      :id="id"
      v-model="model"
      :rows="rows"
      :aria-invalid="error ? 'true' : undefined"
      class="w-full rounded-md border bg-white px-3 py-2.5 text-heading outline-none focus:shadow-[0_3px_10px_0_rgb(0_0_0_/_0.15)]"
      :class="error ? 'border-danger' : 'border-black/20 focus:border-primary'"
    />
    <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>
  </div>
</template>
