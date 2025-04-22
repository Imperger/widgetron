/**
 * Should not use import, because the file used as type helper
 * in an extension code editor
 */

export interface PieSegment {
  label: string;
  value: number;
  color?: string;
}

export interface WidgetModelPieChart {
  type: 'piechart';
  segments: PieSegment[] | number[];
}
