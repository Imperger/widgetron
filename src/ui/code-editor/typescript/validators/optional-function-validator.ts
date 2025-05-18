import * as monaco from 'monaco-editor';
import * as ts from 'typescript';

import { isFunctionWithSignature } from './require-function-validator';

type SearchStatus = 'not_found' | 'found' | 'invalid_signature';

export function optionalFunctionValidator(
  name: string,
  parameterType: string[],
  returnType: string,
) {
  return (tree: ts.SourceFile): monaco.editor.IMarkerData[] => {
    let status: SearchStatus = 'not_found';

    function visit(node: ts.Node) {
      if (status !== 'not_found') {
        return;
      }

      if (ts.isFunctionDeclaration(node) && node.name?.text === name) {
        status = isFunctionWithSignature(node, name, parameterType, returnType)
          ? 'found'
          : 'invalid_signature';

        return;
      }

      ts.forEachChild(node, visit);
    }

    visit(tree);

    return (status as SearchStatus) !== 'invalid_signature'
      ? []
      : [
          {
            startColumn: 1,
            startLineNumber: 1,
            endColumn: 96,
            endLineNumber: 1,
            message: `Invalid signature, expected 'function ${name}(${parameterType.join(', ')}): ${returnType}' function`,
            severity: monaco.MarkerSeverity.Error,
          },
        ];
  };
}
