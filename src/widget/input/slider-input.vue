<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

export interface SliderInputProps {
  label?: string;
  min: number;
  max: number;
  step?: number;
}

const { label = '', min, max, step } = defineProps<SliderInputProps>();

const value = defineModel<number>('value', { required: true });

const inputEl = useTemplateRef('input');
const tooltipEl = useTemplateRef('slider-tooltip');

const tooltipLeft = computed(() => {
  const handleDiameter = 16;

  return inputEl.value
    ? inputEl.value?.offsetLeft +
        (inputEl.value?.clientWidth - handleDiameter) * (value.value / (max - min)) -
        ((tooltipEl.value?.clientWidth ?? 0) - handleDiameter) / 2
    : 0;
});
</script>

<template>
  <div class="slider-input">
    <label class="label">{{ label }}</label>
    <input
      ref="input"
      v-model="value"
      :min="min"
      :max="max"
      :step="step ?? 'any'"
      type="range"
      class="input"
    />
    <span ref="slider-tooltip" :style="{ left: tooltipLeft + 'px' }" class="value-tooltip">{{
      value
    }}</span>
  </div>
</template>

<style scoped>
.slider-input {
  position: relative;
}

.label {
  margin-right: 5px;
}

.input {
  accent-color: #9147ff;
}

.value-tooltip {
  display: none;
  position: absolute;
  bottom: 23.5px;
  padding: 3px;
  color: var(--color-text-input);
  background-color: var(--color-background-input);
  border-radius: var(--input-border-radius-default);
  box-shadow: inset 0 0 0 var(--input-border-width-small) var(--color-border-input);
}

.input:focus ~ .value-tooltip {
  display: inline;
}
</style>
