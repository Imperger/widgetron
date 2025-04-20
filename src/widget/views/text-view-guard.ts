import type { WidgetModel } from '../model/widget-model';
import type { WidgetModelText } from '../model/widget-model-text';

export const isPlainText = (x: WidgetModel): x is string => typeof x === 'string';

export const isTextView = (x: WidgetModel): x is WidgetModelText =>
  isPlainText(x) || x['type'] === 'text';
