<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref } from 'vue';

import type { WidgetModelLineGraph } from '../model/widget-model-line-graph';

import { localStorageInterceptorToken } from '@/injection-tokens';
import { arrayMinMax } from '@/lib/array-min-max';
import { reinterpret_cast } from '@/lib/reinterpret-cast';
import { toSVGCoords } from '@/lib/to-svg-coords';
import type { LocalStorageInterceptorListenerUnsubscriber } from '@/twitch/local-storage-interceptor';
import GraphLegend, { type LegendLabel } from '@/ui/svg/graph-legend.vue';

interface Point {
  x: number;
  y: number;
}

const { xAxis, series, curve = 'smooth' } = defineProps<Omit<WidgetModelLineGraph, 'type'>>();

const localStorageInterceptor = inject(localStorageInterceptorToken);

const twitchThemeKey = 'twilight.theme';

const isLightTheme = ref(localStorage.getItem(twitchThemeKey) === '0');

const closestXAxisIdx = ref<number>(-1);

let localStorageWriteUnsub: LocalStorageInterceptorListenerUnsubscriber | null = null;

const viewBox = { width: 100, height: 100 };

const graphViewBox = {
  x: 10,
  y: 3,
  width: viewBox.width - 15,
  height: viewBox.height - 10,
};

const config = {
  gridRow: {
    light: ['#c0ced7', 'var(--color-background-base)'],
    dark: ['#424242', 'var(--color-background-base)'],
  },
  yAxis: { marginRight: 3, fontSize: 4 },
  xAxis: { marginTop: 1, fontSize: 4 },
  highlight: { circleRadius: 1.5, label: { offsetY: -2, fontSize: 2 } },
  legend: { position: { x: 96, y: 5 }, fontSize: 5, textMarginLeft: 6 },
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

const xStep = computed(() => graphViewBox.width / (xAxis.length - 1));

const drawableSeries = computed(() => series.filter((x) => x.values.length > 1));

const hasSeries = computed(() => drawableSeries.value.length > 0);

const yMinMax = computed(() => arrayMinMax(drawableSeries.value.flatMap((x) => x.values)));

const yStep = computed(
  () => graphViewBox.height / Math.max(yMinMax.value[1] - yMinMax.value[0], 4),
);

const absCubicBezier = (ctrl1: Point, ctrl2: Point, point: Point) =>
  `C ${ctrl1.x},${ctrl1.y} ${ctrl2.x},${ctrl2.y} ${point.x},${point.y}`;

const absMoveTo = (x: number, y: number) => `M${x} ${y}`;
const absLineTo = (x: number, y: number) => `L${x} ${y}`;

const sharpPath = (yValues: number[]): string => {
  return yValues.reduce((cmd, y, n) => {
    if (Number.isNaN(y)) {
      return cmd;
    }

    const instruction = n === 0 || Number.isNaN(yValues[n - 1]) ? absMoveTo : absLineTo;

    return (
      cmd +
      instruction(
        graphViewBox.x + n * xStep.value,
        graphViewBox.y + graphViewBox.height - yStep.value * (y - yMinMax.value[0]),
      )
    );
  }, '');
};

const calcPoint = (yValues: number[], n: number): Point | null =>
  n >= 0 && n < yValues.length && !Number.isNaN(yValues[n])
    ? {
        x: graphViewBox.x + n * xStep.value,
        y: graphViewBox.y + graphViewBox.height - yStep.value * (yValues[n] - yMinMax.value[0]),
      }
    : null;

const smoothPath = (yValues: number[], smoothing = 0.1): string => {
  if (yValues.length < 2) return '';

  const line = (a: Point, b: Point) => {
    const lengthX = b.x - a.x;
    const lengthY = b.y - a.y;
    return {
      length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
      angle: Math.atan2(lengthY, lengthX),
    };
  };

  const controlPoint = (
    current: Point,
    previous: Point | undefined,
    next: Point | undefined,
    reverse: boolean,
  ): Point => {
    const p = previous ?? current;
    const n = next ?? current;

    const o = line(p, n);

    const angle = o.angle + (reverse ? Math.PI : 0);
    const length = o.length * smoothing;

    const x = current.x + Math.cos(angle) * length;
    const y = current.y + Math.sin(angle) * length;

    return { x, y };
  };

  return yValues.reduce((cmd, y, n) => {
    if (Number.isNaN(y)) {
      return cmd;
    }

    const point = calcPoint(yValues, n)!;

    if (n === 0 || Number.isNaN(yValues[n - 1])) {
      return cmd + absMoveTo(point.x, point.y);
    }

    const beforePrev = calcPoint(yValues, n - 2) ?? point;
    const prev = calcPoint(yValues, n - 1) ?? point;
    const next = calcPoint(yValues, n + 1) ?? point;
    const ctrl1 = controlPoint(prev, beforePrev, point, false);
    const ctrl2 = controlPoint(point, prev, next, true);

    return cmd + absCubicBezier(ctrl1, ctrl2, point);
  }, '');
};

const buildPath = computed(() => (curve === 'smooth' ? smoothPath : sharpPath));

const lineColor = (n: number) => series[n].color ?? colorPool[n % colorPool.length];

const totalRows = 3;

const gridRows = computed(() =>
  Array.from({ length: totalRows }, (_, n) => ({
    x: graphViewBox.x,
    y: graphViewBox.y + (n * graphViewBox.height) / totalRows,
    width: graphViewBox.width,
    height: graphViewBox.height / totalRows,
    fill: (isLightTheme.value ? config.gridRow.light : config.gridRow.dark)[n % 2],
  })),
);

const yAxisText = computed(() =>
  Array.from({ length: totalRows + 1 }, (_, n) => ({
    x: graphViewBox.x - config.yAxis.marginRight,
    y:
      graphViewBox.y +
      graphViewBox.height -
      (graphViewBox.height / totalRows) * n +
      config.yAxis.fontSize / 2,
    text: yMinMax.value[0] + (Math.max(yMinMax.value[1] - yMinMax.value[0], 4) / totalRows) * n,
  })),
);

const formatYAxisText = (value: number) =>
  (yMinMax.value[1] - yMinMax.value[0] > 10 ? Math.floor(value) : value.toFixed(1)).toString();

const xAxisText = computed(() =>
  Array.from({ length: xAxis.length }, (_, n) => ({
    x: graphViewBox.x + n * xStep.value,
    y: graphViewBox.y + graphViewBox.height + config.xAxis.marginTop + config.xAxis.fontSize,
    text: xAxis[n],
  })),
);

const onLocalStorageWrite = (key: string, value: string) => {
  if (key === twitchThemeKey) {
    isLightTheme.value = value === '0';
  }

  return false;
};

const onMouseMove = (e: MouseEvent) => {
  const svg = reinterpret_cast<SVGSVGElement>(e.currentTarget);
  const svgPos = toSVGCoords(e, svg);

  if (svgPos === null) {
    closestXAxisIdx.value = -1;

    return;
  }

  const xRelativeToGraph = svgPos.x - graphViewBox.x;

  if (xRelativeToGraph < 0 || xRelativeToGraph > graphViewBox.width) {
    closestXAxisIdx.value = -1;

    return;
  }

  closestXAxisIdx.value = Math.floor((xRelativeToGraph - xStep.value / 2) / xStep.value + 1);
};

const onMouseLeave = () => (closestXAxisIdx.value = -1);

const highlightedYAxisValues = computed(() => {
  if (closestXAxisIdx.value === -1) {
    return [];
  }

  return drawableSeries.value.map((s) => {
    const point = calcPoint(s.values, closestXAxisIdx.value);
    return point
      ? {
          idx: closestXAxisIdx.value,
          ...point,
        }
      : null;
  });
});

const legend = computed<LegendLabel[]>(() =>
  drawableSeries.value.map((x, n) => ({
    label: x.label,
    color: lineColor(n),
  })),
);

onMounted(() => {
  localStorageWriteUnsub = localStorageInterceptor!.subscribe('set', onLocalStorageWrite);
});

onUnmounted(() => {
  localStorageWriteUnsub?.();
});
</script>

<template>
  <svg
    v-if="hasSeries"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="`0 0 ${viewBox.width} ${viewBox.height}`"
    role="presentation"
    class="line-graph"
  >
    <g class="grid-row">
      <rect
        :key="r.y"
        v-for="r of gridRows"
        :x="r.x"
        :y="r.y"
        :width="r.width"
        :height="r.height"
        :fill="r.fill"
      />
    </g>
    <g class="x-axis-text">
      <text
        :key="t.x"
        v-for="t of xAxisText"
        :x="t.x"
        :y="t.y"
        :font-size="config.yAxis.fontSize + 'px'"
        text-anchor="middle"
        fill="var(--color-text-base)"
      >
        {{ t.text }}
      </text>
    </g>
    <g class="y-axis-text">
      <text
        :key="t.y"
        v-for="t of yAxisText"
        :x="t.x"
        :y="t.y"
        :font-size="config.yAxis.fontSize + 'px'"
        text-anchor="end"
        fill="var(--color-text-base)"
      >
        {{ formatYAxisText(t.text) }}
      </text>
    </g>
    <g :key="n" v-for="(s, n) in drawableSeries">
      <path :d="buildPath(s.values)" :stroke="lineColor(n)" fill="transparent" />
    </g>
    <g class="highlight-y-values">
      <g :key="n" v-for="(h, n) of highlightedYAxisValues" class="highlight-y-value">
        <g v-if="h !== null">
          <text
            :font-size="`${config.highlight.label.fontSize}px`"
            :x="h.x"
            :y="h.y + config.highlight.label.offsetY"
            fill="var(--color-text-base)"
            text-anchor="middle"
          >
            {{ drawableSeries[n].values[h.idx] }}
          </text>
          <circle :cx="h.x" :cy="h.y" :r="config.highlight.circleRadius" :fill="lineColor(n)" />
        </g>
      </g>
    </g>
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
.line-graph {
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;
}
</style>
