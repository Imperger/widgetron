<script setup lang="ts">
import { cssVar } from '@/lib/css-var';

interface TickIconProps {
  width?: number | string;
  height?: number | string;
  color?: string;
}

const {
  width = cssVar('button-icon-size-default') ?? 20,
  height = cssVar('button-icon-size-default') ?? 20,
  color = cssVar('color-fill-button-icon') ?? '#ffffff',
} = defineProps<TickIconProps>();
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
    <polygon
      points="437.3,30 202.7,339.3 64,200.7 0,264.7 213.3,478 512,94 "
      transform="matrix(0.06170077,0,0,0.06170077,0.20460288,0.32800442)"
    />
  </svg>
</template>
