<script setup lang="ts">
import { computed } from 'vue';

import { pointOnCircle } from '@/lib/point-on-circle';
import GraphLegend, { type LegendLabel } from '@/ui/svg/graph-legend.vue';

interface SectorGeometricModel {
  fill: number;
  rotate: number;
}

interface SectorPresentationLabel {
  value: number;
  x: number;
  y: number;
}

interface SectorPresentationModel extends SectorGeometricModel {
  color: string;
  label: SectorPresentationLabel;
}

export interface PieSegment {
  label: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  segments: PieSegment[] | number[];
}

const { segments } = defineProps<PieChartProps>();

const config = {
  segment: { fontSize: 4 },
  legend: {
    position: { x: 100, y: 5 },
    fontSize: 5,
    textMarginLeft: 6,
  },
};

const colorPool = [
  '#1565C0',
  '#689F38',
  '#FFEB3B',
  '#F4511E',
  '#607D8B',
  '#D32F2F',
  '#AA00FF',
  '#27AE60',
  '#F1C40F',
  '#2C3E50',
  '#E74C3C',
  '#7F8C8D',
  '#26C6DA',
  '#EC407A',
  '#AEEA00',
];

const pointOnCircleOffset = (
  radius: number,
  sector: SectorGeometricModel,
  offsetX: number,
  offsetY: number,
) => {
  const p = pointOnCircle(radius, sector.rotate + (sector.fill * 360) / 2);

  return { x: p.x + offsetX, y: p.y + offsetY };
};

const isNumericSegments = (x: PieChartProps['segments']): x is number[] =>
  typeof segments[0] === 'number';

const valuesSum = computed(() =>
  segments.length === 0
    ? 0
    : isNumericSegments(segments)
      ? segments.reduce((acc, x) => acc + x, 0)
      : segments.reduce((acc, x) => acc + x.value, 0),
);

const sectors = (values: number[]): SectorGeometricModel[] => {
  if (values.length === 0) {
    return [];
  }

  const model: SectorGeometricModel[] = Array.from({ length: values.length }, () => ({
    fill: 0,
    rotate: 0,
  }));

  model[0].fill = values[0] / valuesSum.value;

  for (let n = 1; n < values.length; ++n) {
    model[n].fill = values[n] / valuesSum.value;
    model[n].rotate = model[n - 1].rotate + model[n - 1].fill * 360;
  }

  return model;
};

const segmentModels = computed<SectorGeometricModel[]>(() =>
  isNumericSegments(segments) ? sectors(segments) : sectors(segments.map((x) => x.value)),
);

const segmentPresentationModels = computed<SectorPresentationModel[]>(() =>
  isNumericSegments(segments)
    ? segmentModels.value.map((x, n) => ({
        ...x,
        label: { value: segments[n], ...pointOnCircleOffset(25, x, 50, 50) },
        color: colorPool[n % colorPool.length],
      }))
    : segmentModels.value.map((x, n) => ({
        ...x,
        label: { value: segments[n].value, ...pointOnCircleOffset(25, x, 50, 50) },
        color: segments[n].color ?? colorPool[n % colorPool.length],
      })),
);

const legend = computed<LegendLabel[]>(() =>
  isNumericSegments(segments)
    ? []
    : segmentPresentationModels.value.map((x, n) => ({
        label: segments[n].label,
        color: x.color,
      })),
);

const nonEmptySegments = computed(() =>
  segmentPresentationModels.value.filter((x) => x.fill !== 0),
);
</script>

<template>
  <svg
    v-if="valuesSum > 0"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    role="presentation"
    class="pie-chart"
  >
    <circle
      :key="segment.rotate"
      v-for="segment in segmentPresentationModels"
      r="25"
      cx="50"
      cy="50"
      fill="transparent"
      :stroke="segment.color"
      stroke-width="50"
      :stroke-dasharray="`calc(${segment.fill} * 157) 157`"
      :transform="`rotate(${segment.rotate}, 50, 50)`"
    />
    <text
      :key="segment.rotate"
      v-for="segment in nonEmptySegments"
      :font-size="`${config.segment.fontSize}px`"
      :x="segment.label.x"
      :y="segment.label.y + config.segment.fontSize / 2"
      text-anchor="middle"
    >
      {{ segment.label.value }}
    </text>
    <GraphLegend
      :position="config.legend.position"
      :font-size="config.legend.fontSize"
      :text-margin-left="config.legend.textMarginLeft"
      :labels="legend"
    />
  </svg>
  <div v-else>No data</div>
</template>

<style scoped>
.pie-chart {
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
