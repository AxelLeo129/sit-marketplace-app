<script setup lang="ts">
/**
 * Mensaje destacado: error, éxito, advertencia o información.
 */
import { computed } from 'vue'
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-vue-next'

const props = withDefaults(defineProps<{ variant?: 'danger' | 'success' | 'warning' | 'info' }>(), {
  variant: 'info',
})

const styles = {
  danger: { classes: 'bg-danger/10 text-danger', icon: CircleAlert },
  success: { classes: 'bg-success/10 text-success', icon: CircleCheck },
  warning: { classes: 'bg-warning/10 text-warning', icon: TriangleAlert },
  info: { classes: 'bg-info/10 text-info', icon: Info },
}

const style = computed(() => styles[props.variant])
</script>

<template>
  <div
    :role="variant === 'danger' ? 'alert' : 'status'"
    class="flex items-start gap-2 rounded-md px-4 py-3 text-sm"
    :class="style.classes"
  >
    <component :is="style.icon" class="mt-0.5 size-4 shrink-0" />
    <div><slot /></div>
  </div>
</template>
