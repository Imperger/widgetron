import type * as monaco from 'monaco-editor';

import type { ExtraLib } from './typescript-editor.vue';
import type { Validator } from './validators/merge-validators';

import type { WindowInstance } from '@/window-manager/window-instance';

export interface TypescriptEditorWindowInstance extends WindowInstance {
  type: 'typescript_editor_window';
  label?: string;
  extraLibs?: ExtraLib[];
  placeholder: string;
  validators?: Validator[];
  onInitialized: (instance: monaco.editor.IStandaloneCodeEditor) => void;
  onSave: (label: string) => Promise<void>;
  onExecute: () => Promise<void>;
  onClose: () => void;
}
