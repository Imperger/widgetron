<script setup lang="ts">
import { cssVar } from '@/lib/css-var';

interface PlayIconProps {
  width?: number | string;
  height?: number | string;
  color?: string;
}

const {
  width = cssVar('button-icon-size-default') ?? 20,
  height = cssVar('button-icon-size-default') ?? 20,
  color = cssVar('color-fill-button-icon') ?? '#ffffff',
} = defineProps<PlayIconProps>();
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
      d="m 23.222858,11.692784 c 2.285367,1.428268 3.427892,2.142385 3.819792,3.056818 0.342218,0.798403 0.342218,1.70236 0,2.50092 -0.3919,0.914275 -1.534425,1.628392 -3.819792,3.056787 L 12.489345,27.015794 C 9.9529486,28.601011 8.6847426,29.3937 7.6381847,29.309415 6.725943,29.236082 5.8897146,28.772755 5.3440387,28.038003 4.7180154,27.195156 4.7180154,25.69962 4.7180154,22.708548 V 9.2915292 c 0,-2.9910407 0,-4.486545 0.6260233,-5.3294391 C 5.8897146,3.2273694 6.725943,2.7638992 7.6381847,2.6905509 8.6847426,2.606425 9.9529486,3.3990497 12.489345,4.9842996 Z"
      :stroke="color"
      stroke-width="3.17457"
      stroke-linejoin="round"
    />
  </svg>
</template>
