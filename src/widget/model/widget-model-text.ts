export interface WidgetModelFormattedText {
  type: 'text';
  text: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: 'start' | 'end' | 'left' | 'right' | 'center' | 'justify' | 'match-parent';
  border?: string;
  fontSize?: string;
  fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number;
  margin?: string;
  padding?: string;
}

export type WidgetModelText = WidgetModelFormattedText | string;
