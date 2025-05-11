import type { WindowInstance } from '@/window-manager/window-instance';

export interface WidgetInstance extends WindowInstance {
  type: 'widget_instance';
  key: number;
  label?: string;
  updatePeriod: number;
  sourceCode: string;
  onClose?: () => void;
}
