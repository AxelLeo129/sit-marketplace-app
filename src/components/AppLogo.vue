<script setup lang="ts">
/**
 * Logotipo de SIT Marketplace (ícono de SIT + nombre).
 */
import logo from '@/assets/images/logo.png'

withDefaults(defineProps<{ showName?: boolean }>(), { showName: true })
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <img :src="logo" alt="SIT" class="size-10 rounded-lg" />
    <span v-if="showName" class="text-xl font-semibold text-primary">SIT Marketplace</span>
  </span>
</template>
