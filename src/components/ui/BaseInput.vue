<script setup lang="ts">
/**
 * Campo de texto con etiqueta, ícono opcional y mensaje de error.
 */
import { useId, type Component } from 'vue'

withDefaults(
  defineProps<{
    label?: string
    type?: string
    placeholder?: string
    error?: string
    icon?: Component
    autocomplete?: string
    required?: boolean
  }>(),
  { type: 'text' },
)

const model = defineModel<string | number | null>()
const id = useId()
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="mb-1 block text-xs font-medium text-content">
      {{ label }}<span v-if="required" class="text-danger"> *</span>
    </label>
    <div class="relative">
      <component
        :is="icon"
        v-if="icon"
        class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-content/60"
      />
      <input
        :id="id"
        v-model="model"
        :type="type"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :required="required"
        :aria-invalid="error ? 'true' : undefined"
        class="w-full rounded-md border bg-white px-3 py-2.5 text-heading transition-shadow outline-none placeholder:text-content/50 focus:shadow-[0_3px_10px_0_rgb(0_0_0_/_0.15)]"
        :class="[
          icon ? 'pl-10' : '',
          error ? 'border-danger' : 'border-black/20 focus:border-primary',
        ]"
      />
    </div>
    <p v-if="error" class="mt-1 text-xs text-danger">{{ error }}</p>
  </div>
</template>
