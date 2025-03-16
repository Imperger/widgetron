<script setup lang="ts">
import ErrorIcon from '../icons/error-icon.vue';

export interface ErrrorLogProps {
  logs: string[];
}

const { logs } = defineProps<ErrrorLogProps>();
</script>

<template>
  <div>
    <div v-for="log in logs" :key="log" class="error-log-item">
      <ErrorIcon color="#f30a0a" />
      <div>{{ log }}</div>
    </div>
  </div>
</template>

<style scoped>
.error-log-item {
  display: flex;
  flex-direction: row;
  color: #00000e;
  border-top: 1px solid gray;
}
</style>
