/**
 * Should not use import, because the file used as type helper
 * in an extension code editor
 */

export interface UISliderInput {
  label?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
}
