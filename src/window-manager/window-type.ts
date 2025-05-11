import type { CssEditorWindowInstance } from '@/ui/code-editor/css/css-editor-window-instance';
import type { TypescriptEditorWindowInstance } from '@/ui/code-editor/typescript/typescript-editor-window-instance';
import type { WidgetInstance } from '@/widget/widget-instance';

export type WindowInstanceType =
  | WidgetInstance
  | TypescriptEditorWindowInstance
  | CssEditorWindowInstance;
