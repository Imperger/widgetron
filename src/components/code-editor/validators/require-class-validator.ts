import type { CssStylesheetAST } from '@adobe/css-tools';
import * as monaco from 'monaco-editor';

export function requireClassValidator(...classList: string[]) {
  return (tree: CssStylesheetAST): monaco.editor.IMarkerData[] => {
    const missing = [...classList];

    let valid = true;
    for (const name of classList) {
      const found = tree.stylesheet.rules.some(
        (x) => x.type === 'rule' && x.selectors.some((s) => s === `.${name}`),
      );

      if (found) {
        missing.splice(missing.indexOf(name), 1);
      }

      valid &&= found;
    }

    return missing.map((x) => ({
      startColumn: 1,
      startLineNumber: 1,
      endColumn: 96,
      endLineNumber: 1,
      message: `Missing required '${x}' class`,
      severity: monaco.MarkerSeverity.Error,
    }));
  };
}
