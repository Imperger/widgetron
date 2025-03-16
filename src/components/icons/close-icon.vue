<script setup lang="ts">
import { cssVar } from '@/lib/css-var';

interface CloseIconProps {
  width?: number | string;
  height?: number | string;
  color?: string;
}

const {
  width = cssVar('button-icon-size-default') ?? 20,
  height = cssVar('button-icon-size-default') ?? 20,
  color = cssVar('color-fill-button-icon') ?? '#ffffff',
} = defineProps<CloseIconProps>();
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="width"
    :height="height"
    viewBox="0 0 32 32"
    role="presentation"
    :fill="color"
  >
    <path
      d="m 4.004097,2.9182361 a 2.4263719,2.6460067 0 0 1 3.4308893,0 L 16.01464,12.274514 24.594291,2.9182361 a 2.4263719,2.6460067 0 0 1 3.430891,3.7414537 l -8.579653,9.3562782 8.579653,9.356281 a 2.4263719,2.6460067 0 0 1 -3.430891,3.741453 l -8.579651,-9.35628 -8.5796537,9.35628 A 2.4263719,2.6460067 0 0 1 4.004097,25.372249 L 12.58375,16.015968 4.004097,6.6596898 a 2.4263719,2.6460067 0 0 1 0,-3.7414537 z"
      style="stroke-width: 0.0395909"
    />
  </svg>
</template>
