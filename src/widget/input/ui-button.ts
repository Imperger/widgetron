/**
 * Should not use import, because the file used as type helper
 * in an extension code editor
 */

export interface UIButton {
  caption: string;
  display?: 'inline' | 'block' | 'none';
  color?: string;
  backgroundColor?: string;
  textAlign?: 'start' | 'end' | 'left' | 'right' | 'center' | 'justify' | 'match-parent';
  border?: string;
  fontSize?: string;
  fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number;
  margin?: string;
  padding?: string;
}
