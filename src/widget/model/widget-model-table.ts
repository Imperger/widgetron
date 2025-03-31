/**
 * Should not use import, because the file used as type helper
 * in an extension code editor
 */

export interface WidgetModelTableCell {
  text: string;
}

export interface WidgetModelTableRow {
  cells: WidgetModelTableCell[];
}

export interface WidgetModelTable {
  type: 'table';
  rows: WidgetModelTableRow[];
}
