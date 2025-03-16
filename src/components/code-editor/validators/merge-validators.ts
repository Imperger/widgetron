import type { CssStylesheetAST } from '@adobe/css-tools';
import * as monaco from 'monaco-editor';
import type { Ref } from 'vue';

import type { ValidationResultResolver } from '../css-editor.vue';

export type Validator = (tree: CssStylesheetAST) => monaco.editor.IMarkerData[];

export function mergeValidators(errors: Ref<string[]>, ...validators: Validator[]) {
  return (tree: CssStylesheetAST, resolve: ValidationResultResolver) => {
    const markers = validators.flatMap((x) => x(tree));

    errors.value = markers.map((x) => x.message);

    resolve(markers);
  };
}
