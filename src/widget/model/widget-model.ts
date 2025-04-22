import type { WidgetModelPieChart } from './widget-model-pie-chart';
import type { WidgetModelTable } from './widget-model-table';
import type { WidgetModelText } from './widget-model-text';

export type WidgetModel = WidgetModelTable | WidgetModelText | WidgetModelPieChart;
