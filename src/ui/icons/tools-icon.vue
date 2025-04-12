<script setup lang="ts">
import { cssVar } from '@/lib/css-var';

interface ToolsIconProps {
  width?: number | string;
  height?: number | string;
  color?: string;
}

const {
  width = cssVar('button-icon-size-default') ?? 20,
  height = cssVar('button-icon-size-default') ?? 20,
  color = 'var(--color-fill-button-icon)',
} = defineProps<ToolsIconProps>();
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
    <g fill="none" stroke-width="2">
      <path
        transform="translate(-.51012)"
        x="2.5505824"
        y="2.0617208"
        width="11.876558"
        height="11.876558"
        ry="1.4878398"
        d="m4.0384 2.0617h8.9009c0.82426 0 1.4878 0.66358 1.4878 1.4878v8.9009c0 0.82426-0.66358 1.4878-1.4878 1.4878h-8.9009c-0.82426 0-1.4878-0.66358-1.4878-1.4878v-8.9009c0-0.82426 0.66358-1.4878 1.4878-1.4878z"
      />
      <path
        transform="translate(15.515)"
        x="2.5505824"
        y="2.0617208"
        width="11.876558"
        height="11.876558"
        ry="1.4878398"
        d="m4.0384 2.0617h8.9009c0.82426 0 1.4878 0.66358 1.4878 1.4878v8.9009c0 0.82426-0.66358 1.4878-1.4878 1.4878h-8.9009c-0.82426 0-1.4878-0.66358-1.4878-1.4878v-8.9009c0-0.82426 0.66358-1.4878 1.4878-1.4878z"
      />
      <path
        transform="translate(-.51012 16)"
        x="2.5505824"
        y="2.0617208"
        width="11.876558"
        height="11.876558"
        ry="1.4878398"
        d="m4.0384 2.0617h8.9009c0.82426 0 1.4878 0.66358 1.4878 1.4878v8.9009c0 0.82426-0.66358 1.4878-1.4878 1.4878h-8.9009c-0.82426 0-1.4878-0.66358-1.4878-1.4878v-8.9009c0-0.82426 0.66358-1.4878 1.4878-1.4878z"
      />
      <path
        transform="translate(15.515 16)"
        x="2.5505824"
        y="2.0617208"
        width="11.876558"
        height="11.876558"
        ry="1.4878398"
        d="m4.0384 2.0617h8.9009c0.82426 0 1.4878 0.66358 1.4878 1.4878v8.9009c0 0.82426-0.66358 1.4878-1.4878 1.4878h-8.9009c-0.82426 0-1.4878-0.66358-1.4878-1.4878v-8.9009c0-0.82426 0.66358-1.4878 1.4878-1.4878z"
      />
    </g>
  </svg>
</template>
