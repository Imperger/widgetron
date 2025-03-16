import type { CssStylesheetAST } from '@adobe/css-tools';
import * as monaco from 'monaco-editor';

export function parsingErorValidator() {
  return (tree: CssStylesheetAST): monaco.editor.IMarkerData[] => {
    const errors: monaco.editor.IMarkerData[] = [];

    if (tree.stylesheet.parsingErrors?.length !== 0) {
      tree.stylesheet.parsingErrors?.forEach((x) =>
        errors.push({
          message: x.message,
          startColumn: x.column,
          startLineNumber: x.line,
          endColumn: x.column,
          endLineNumber: x.line,
          severity: monaco.MarkerSeverity.Error,
        }),
      );
    }

    return errors;
  };
}
