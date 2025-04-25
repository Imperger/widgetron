<script setup lang="ts">
import { cssVar } from '@/lib/css-var';

interface CalendarIconProps {
  width?: number | string;
  height?: number | string;
  color?: string;
}

const {
  width = cssVar('button-icon-size-default') ?? 20,
  height = cssVar('button-icon-size-default') ?? 20,
  color = 'var(--color-fill-button-icon)',
} = defineProps<CalendarIconProps>();
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
      d="m3.4008 13.199h25.198m-19.599-9.7993v2.7998m13.999-2.7998v2.7998m-15.119 22.399h16.239c1.568 0 2.3521 0 2.951-0.30518 0.52678-0.26836 0.95516-0.69673 1.2235-1.2235 0.30518-0.59888 0.30518-1.383 0.30518-2.951v-13.439c0-1.568 0-2.3521-0.30518-2.951-0.26836-0.52683-0.69673-0.95514-1.2235-1.2236-0.59888-0.30517-1.383-0.30517-2.951-0.30517h-16.239c-1.568 0-2.3521 0-2.951 0.30517-0.52683 0.26842-0.95514 0.69673-1.2236 1.2236-0.30517 0.59891-0.30517 1.3829-0.30517 2.951v13.439c0 1.568 0 2.3521 0.30517 2.951 0.26842 0.52678 0.69673 0.95516 1.2236 1.2235 0.59891 0.30518 1.3829 0.30518 2.951 0.30518z"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2.7998"
    />
  </svg>
</template>
