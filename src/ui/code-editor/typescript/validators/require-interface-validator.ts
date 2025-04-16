import * as monaco from 'monaco-editor';
import * as ts from 'typescript';

export function requireInterfaceValidator(name: string) {
  return (tree: ts.SourceFile): monaco.editor.IMarkerData[] => {
    let found = false;

    function visit(node: ts.Node) {
      if (found) {
        return;
      }

      if (ts.isInterfaceDeclaration(node) && node.name.text === name) {
        found = true;
        return;
      }

      ts.forEachChild(node, visit);
    }

    visit(tree);

    return found
      ? []
      : [
          {
            startColumn: 1,
            startLineNumber: 1,
            endColumn: 96,
            endLineNumber: 1,
            message: `Missing required interface '${name}'`,
            severity: monaco.MarkerSeverity.Error,
          },
        ];
  };
}
