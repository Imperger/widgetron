/**
 * Should not use import, because the file used as type helper
 * in an extension code editor
 */

export interface GraphSeries {
  label: string;
  values: number[];
  color?: string;
}

export interface WidgetModelLineGraph {
  type: 'linegraph';
  xAxis: string[];
  series: GraphSeries[];
  curve?: 'smooth' | 'straight';
}
