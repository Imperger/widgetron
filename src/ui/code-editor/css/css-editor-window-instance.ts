import type * as monaco from 'monaco-editor';

import type { Validator } from './validators/merge-validators';

import type { WindowInstance } from '@/window-manager/window-instance';

export interface CssEditorWindowInstance extends WindowInstance {
  type: 'css_editor_window';
  title: string;
  validators?: Validator[];
  onInitialized: (instance: monaco.editor.IStandaloneCodeEditor) => void;
  onSave: () => void;
  onClose: () => void;
}
