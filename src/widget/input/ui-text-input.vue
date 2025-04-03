<script setup lang="ts">
export interface UITextInputProps {
  label?: string;
}

const { label = '' } = defineProps<UITextInputProps>();

const value = defineModel<string>('value', { required: true });
</script>

<template>
  <div>
    <label>{{ label }}</label>
    <input v-model="value" type="text" />
  </div>
</template>

<style scoped></style>
