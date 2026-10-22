<script setup lang="ts">
/**
 * Pide confirmación antes de una acción: en rojo si no se puede deshacer
 * (p. ej. eliminar) o en azul si es un paso normal (p. ej. salir a ruta).
 */
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

withDefaults(
  defineProps<{
    title?: string
    message: string
    confirmLabel?: string
    variant?: 'danger' | 'primary'
    loading?: boolean
  }>(),
  { title: 'Confirmar', confirmLabel: 'Eliminar', variant: 'danger', loading: false },
)
const emit = defineEmits<{ confirm: [] }>()

const open = defineModel<boolean>('open', { required: true })
</script>

<template>
  <BaseModal v-model:open="open" :title="title">
    <p>{{ message }}</p>
    <template #footer>
      <BaseButton variant="outline" @click="open = false">Cancelar</BaseButton>
      <BaseButton :variant="variant" :loading="loading" @click="emit('confirm')">
        {{ confirmLabel }}
      </BaseButton>
    </template>
  </BaseModal>
</template>
