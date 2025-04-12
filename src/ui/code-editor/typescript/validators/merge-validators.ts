import * as monaco from 'monaco-editor';
import * as typescript from 'typescript';
import type { Ref } from 'vue';

import type { ValidationResultResolver } from '../typescript-editor.vue';

export type Validator = (tree: typescript.SourceFile) => monaco.editor.IMarkerData[];

export function mergeValidators(errors: Ref<string[]>, ...validators: Validator[]) {
  return (tree: typescript.SourceFile, resolve: ValidationResultResolver) => {
    const markers = validators.flatMap((x) => x(tree));

    errors.value = markers.map((x) => x.message);

    resolve(markers);
  };
}
