<script setup lang="ts">
/**
 * Foto del usuario o, si no tiene, sus iniciales.
 */
import { computed } from 'vue'

const props = withDefaults(defineProps<{ name: string; src?: string | null; size?: string }>(), {
  src: null,
  size: 'size-10',
})

const initials = computed(() =>
  props.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join(''),
)
</script>

<template>
  <img v-if="src" :src="src" :alt="name" class="rounded-full object-cover" :class="size" />
  <span
    v-else
    class="grid place-items-center rounded-full bg-primary/15 font-semibold text-primary"
    :class="size"
    aria-hidden="true"
  >
    {{ initials }}
  </span>
</template>
