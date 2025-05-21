import * as monaco from 'monaco-editor';
import * as ts from 'typescript';

import { TypescriptExtractor } from '@/lib/typescript/typescript-extractor';
import { NamingConvention } from '@/widget/input/naming-convention';

export function requireButtonClickHandlerValidator() {
  return (tree: ts.SourceFile): monaco.editor.IMarkerData[] => {
    const buttons = TypescriptExtractor.findButtonsInUIInput(tree);

    if (buttons.length === 0) {
      return [];
    }

    const globalScopeFunctions = TypescriptExtractor.globalScopeFunctionNames(tree);

    return buttons
      .filter((x) => !globalScopeFunctions.includes(NamingConvention.onClick(x.id)))
      .map(({ id, ...x }) => ({
        ...x,
        message: `Missing 'async function ${NamingConvention.onClick(id)}(input: UIInput, api: API): Promise<void>' handler for the '${id}' button`,
        severity: monaco.MarkerSeverity.Error,
      }));
  };
}
