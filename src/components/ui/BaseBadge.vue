<script setup lang="ts">
/**
 * Etiqueta de estado (vs-chip de Vuexy), p. ej. "Activo" en verde.
 */
withDefaults(
  defineProps<{ variant?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'muted' }>(),
  { variant: 'primary' },
)

const variants = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
  muted: 'bg-black/5 text-content',
}
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
    :class="variants[variant]"
  >
    <slot />
  </span>
</template>
