<script setup lang="ts">
export interface UIButtonProps {
  caption?: string;
}

export interface UIButtonEvents {
  (e: 'click'): void;
}

const { caption = '' } = defineProps<UIButtonProps>();
const emit = defineEmits<UIButtonEvents>();
</script>

<template>
  <button @click="emit('click')">{{ caption }}</button>
</template>

<style scoped></style>
