<script setup lang="ts">
import { cssVar } from '@/lib/css-var';

interface EditIconProps {
  width?: number | string;
  height?: number | string;
  color?: string;
}

const {
  width = cssVar('button-icon-size-default') ?? 20,
  height = cssVar('button-icon-size-default') ?? 20,
  color = cssVar('color-fill-button-icon') ?? '#ffffff',
} = defineProps<EditIconProps>();
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="width"
    :height="height"
    viewBox="0 0 32 32"
    role="presentation"
  >
    <g id="Complete" transform="matrix(1.2182442,0,0,1.2182442,1.3810946,1.3810444)">
      <g id="edit">
        <g id="g1">
          <path
            d="m 20,16 v 4 a 2,2 0 0 1 -2,2 H 4 A 2,2 0 0 1 2,20 V 6 A 2,2 0 0 1 4,4 h 4"
            fill="none"
            :stroke="color"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            id="path1"
          />
          <polygon
            fill="none"
            points="8,16 12.5,15.8 22,6.2 17.8,2 8.3,11.5 "
            :stroke="color"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            id="polygon1"
          />
        </g>
      </g>
    </g>
  </svg>
</template>
