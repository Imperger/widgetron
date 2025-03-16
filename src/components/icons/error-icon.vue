<script setup lang="ts">
import { cssVar } from '@/lib/css-var';

interface ErrorIconProps {
  width?: number | string;
  height?: number | string;
  color?: string;
}

const {
  width = cssVar('button-icon-size-default') ?? 20,
  height = cssVar('button-icon-size-default') ?? 20,
  color = cssVar('color-fill-button-icon') ?? '#ffffff',
} = defineProps<ErrorIconProps>();
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
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M 16,28.114237 C 22.690693,28.114237 28.114237,22.690693 28.114237,16 28.114237,9.309307 22.690693,3.885763 16,3.885763 9.309307,3.885763 3.885763,9.309307 3.885763,16 3.885763,22.690693 9.309307,28.114237 16,28.114237 Z m -1.817136,-6.068021 c 0,-1.050305 0.798329,-1.806233 1.806233,-1.806233 1.02971,0 1.828039,0.755928 1.828039,1.806233 0,1.050304 -0.798329,1.828038 -1.828039,1.828038 -1.007904,0 -1.806233,-0.777734 -1.806233,-1.828038 z M 14.996941,8.731458 a 0.60571185,0.60571185 0 0 0 -0.6045,0.632363 l 0.370695,8.479966 a 0.60571185,0.60571185 0 0 0 0.605712,0.57906 h 1.263515 a 0.60571185,0.60571185 0 0 0 0.605712,-0.57906 L 17.607559,9.363821 A 0.60571185,0.60571185 0 0 0 17.001847,8.731458 Z"
      style="stroke-width: 1.21142"
    />
  </svg>
</template>
