<script setup lang="ts">
import ErrorIcon from '../icons/error-icon.vue';

export interface ErrrorLogProps {
  logs: string[];
}

const { logs } = defineProps<ErrrorLogProps>();
</script>

<template>
  <div class="error-log">
    <div v-for="log in logs" :key="log" class="error-log-item">
      <ErrorIcon color="#f30a0a" />
      <div>{{ log }}</div>
    </div>
  </div>
</template>

<style scoped>
.error-log {
  background-color: var(--color-background-base);
}

.error-log-item {
  display: flex;
  flex-direction: row;
  color: var(--color-text-input);
  border-top: 1px solid gray;
}
</style>
