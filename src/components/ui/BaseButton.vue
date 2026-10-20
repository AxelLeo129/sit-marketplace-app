<script setup lang="ts">
/**
 * Botón con el estilo de Vuexy: sombra del color al pasar el mouse.
 */
import { computed } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'success' | 'danger' | 'outline' | 'flat'
    type?: 'button' | 'submit'
    loading?: boolean
    disabled?: boolean
    block?: boolean
  }>(),
  { variant: 'primary', type: 'button', loading: false, disabled: false, block: false },
)

const variants = {
  primary: 'bg-primary text-white hover:shadow-[0_8px_25px_-8px_var(--color-primary)]',
  success: 'bg-success text-white hover:shadow-[0_8px_25px_-8px_var(--color-success)]',
  danger: 'bg-danger text-white hover:shadow-[0_8px_25px_-8px_var(--color-danger)]',
  outline: 'border border-primary text-primary hover:bg-primary/5',
  flat: 'bg-primary/10 text-primary hover:bg-primary/20',
}

const classes = computed(() => [variants[props.variant], props.block ? 'w-full' : ''])
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-6 py-2.5 font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
    :class="classes"
  >
    <LoaderCircle v-if="loading" class="size-4 animate-spin" />
    <slot />
  </button>
</template>
