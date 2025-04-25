mode.value = 'time';
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
  color = 'var(--color-fill-button-icon)',
} = defineProps<CloseIconProps>();
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="width"
    :height="height"
    viewBox="0 0 32 32"
    role="presentation"
    fill="none"
    :stroke="color"
  >
    <path
      d="m16 9v7l3.5 2.1m9.1-2.1c0 6.9588-5.6412 12.6-12.6 12.6-6.9588 0-12.6-5.6412-12.6-12.6 0-6.9588 5.6412-12.6 12.6-12.6 6.9588 0 12.6 5.6412 12.6 12.6z"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2.8"
    />
  </svg>
</template>
