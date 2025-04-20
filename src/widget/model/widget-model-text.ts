export interface WidgetModelFormattedText {
  type: 'text';
  color?: string;
  fontSize?: string;
  text: string;
}

export type WidgetModelText = WidgetModelFormattedText | string;
