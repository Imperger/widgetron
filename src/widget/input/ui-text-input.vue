<script setup lang="ts">
export interface UITextInputProps {
  label?: string;
}

const { label = '' } = defineProps<UITextInputProps>();

const value = defineModel<string>('value', { required: true });
</script>

<template>
  <div>
    <label class="label">{{ label }}</label>
    <input v-model="value" type="text" class="text-input" />
  </div>
</template>

<style scoped>
.label {
  margin-right: 5px;
}

.text-input {
  box-sizing: border-box;
  height: var(--input-size-default);
  color: var(--color-text-input);
  font-size: var(--input-text-default);
  font-weight: var(--font-weight-normal);
  padding: 0.5rem 1rem;
  border-radius: var(--input-border-radius-default);
  border: 3px solid transparent;
  box-shadow: inset 0 0 0 var(--input-border-width-small) var(--color-border-input);
  outline: none;
  background-color: var(--color-background-input);
}

.text-input:focus {
  border: 3px solid var(--color-border-input-focus);
}
</style>
