<script setup lang="ts">
import { cssVar } from '@/lib/css-var';

interface ArrowRightIconProps {
  width?: number | string;
  height?: number | string;
  color?: string;
}

const {
  width = cssVar('button-icon-size-default') ?? 20,
  height = cssVar('button-icon-size-default') ?? 20,
  color = 'var(--color-fill-button-icon)',
} = defineProps<ArrowRightIconProps>();
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="width"
    :height="height"
    viewBox="0 0 32 32"
    role="presentation"
    :stroke="color"
  >
    <path
      d="m8.736 3.5855 14.528 12.428v0l-14.528 12.401"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="3.4386"
    />
  </svg>
</template>
