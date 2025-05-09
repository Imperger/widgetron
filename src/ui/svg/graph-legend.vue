<script setup lang="ts">
import { computed } from 'vue';

interface Position {
  x: number;
  y: number;
}

export interface LegendLabel {
  color: string;
  label: string;
}

interface PositionedLegendLabel extends LegendLabel {
  x: number;
  y: number;
}

export interface GraphLegendProps {
  position: Position;
  fontSize: number;
  textMarginLeft: number;
  labels: LegendLabel[];
}

const { position, fontSize, textMarginLeft, labels } = defineProps<GraphLegendProps>();

const legend = computed<PositionedLegendLabel[]>(() =>
  labels.map((x, n) => ({
    ...x,
    x: position.x,
    y: position.y + (n * fontSize + 1),
  })),
);
</script>

<template>
  <g :key="n" v-for="(l, n) in legend">
    <rect :x="l.x" :y="l.y - fontSize" :fill="l.color" width="5" height="5" />
    <text
      :font-size="`${fontSize}px`"
      :x="l.x + textMarginLeft"
      :y="l.y"
      fill="var(--color-text-base)"
    >
      {{ l.label }}
    </text>
  </g>
</template>
