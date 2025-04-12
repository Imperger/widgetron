<script setup lang="ts">
import { cssVar } from '@/lib/css-var';

interface GearIconProps {
  width?: number | string;
  height?: number | string;
  color?: string;
}

const {
  width = cssVar('button-icon-size-default') ?? 20,
  height = cssVar('button-icon-size-default') ?? 20,
  color = cssVar('color-fill-button-icon') ?? '#ffffff',
} = defineProps<GearIconProps>();
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
      d="m 23.061103,8.816604 a 10.108515,10.108515 0 0 1 2.481598,4.288071 h 3.140171 v 5.520592 h -3.140171 a 10.108515,10.108515 0 0 1 -2.481598,4.29175 l 1.572844,2.722586 -4.779239,2.759374 -1.569164,-2.722583 a 10.136109,10.136109 0 0 1 -4.957682,0 L 11.756858,28.398977 6.9776195,25.639603 8.5504639,22.917017 A 10.108515,10.108515 0 0 1 6.0688658,18.625267 H 2.9286942 v -5.51875 H 6.0688657 A 10.108515,10.108515 0 0 1 8.5504639,8.814767 L 6.9757781,6.0940217 11.753181,3.3346443 h 0.0055 l 1.571004,2.7189043 a 10.136109,10.136109 0 0 1 4.957678,0 l 1.565484,-2.7189043 h 0.0037 l 4.77924,2.7593774 -1.572845,2.7225823 z m -1.736568,7.049286 a 5.5187524,5.5187524 0 1 0 -11.037503,0 5.5187524,5.5187524 0 0 0 11.037503,0 z"
      style="stroke-width: 0.0287435"
    />
  </svg>
</template>
