<script setup lang="ts">
/**
 * Botón para elegir una imagen. Revisa tipo y tamaño antes de subirla
 * (la API vuelve a validarlo): JPG, PNG o WEBP de hasta 2 MB.
 */
import { ref } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps<{ label: string; loading?: boolean }>()
const emit = defineEmits<{ select: [file: File] }>()

const MAX_BYTES = 2 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

const input = ref<HTMLInputElement | null>(null)
const error = ref('')

function onChange(event: Event): void {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = '' // Permite volver a elegir el mismo archivo.
  error.value = ''

  if (!file) return

  if (!ACCEPTED.includes(file.type)) {
    error.value = 'La imagen debe ser JPG, PNG o WEBP.'
  } else if (file.size > MAX_BYTES) {
    error.value = 'La imagen no puede pesar más de 2 MB.'
  } else {
    emit('select', file)
  }
}
</script>

<template>
  <div>
    <input ref="input" type="file" :accept="ACCEPTED.join(',')" class="hidden" @change="onChange" />
    <BaseButton variant="flat" :loading="loading" @click="input?.click()">{{ label }}</BaseButton>
    <p class="mt-1 text-xs" :class="error ? 'text-danger' : ''">
      {{ error || 'JPG, PNG o WEBP. Máximo 2 MB.' }}
    </p>
  </div>
</template>
