import * as monaco from 'monaco-editor';
import * as ts from 'typescript';

type ValidTypeKind =
  | ts.SyntaxKind.NumberKeyword
  | ts.SyntaxKind.StringKeyword
  | ts.SyntaxKind.BooleanKeyword
  | ts.SyntaxKind.BigIntKeyword
  | ts.SyntaxKind.VoidKeyword
  | ts.SyntaxKind.UndefinedKeyword;

function toSyntaxKind(type: string): ValidTypeKind {
  switch (type) {
    case 'number':
      return ts.SyntaxKind.NumberKeyword;
    case 'string':
      return ts.SyntaxKind.StringKeyword;
    case 'boolean':
      return ts.SyntaxKind.BooleanKeyword;
    case 'bigint':
      return ts.SyntaxKind.BigIntKeyword;
    case 'void':
      return ts.SyntaxKind.VoidKeyword;
  }

  return ts.SyntaxKind.UndefinedKeyword;
}

function isClassParameter(node: ts.ParameterDeclaration, name: string): boolean {
  const type = node.type;
  if (type && ts.isTypeReferenceNode(type)) {
    if (ts.isIdentifier(type.typeName)) {
      return type.typeName.text === name;
    }
  }

  return false;
}
function isFunctionWithSignature(
  node: ts.FunctionDeclaration,
  name: string,
  parameterType: string[],
  returnType: string,
): boolean {
  if (node.name && node.name.text !== name) {
    return false;
  }

  const parameters = node.parameters;
  if (parameters.length !== parameterType.length) {
    return false;
  }

  const isParametersValid = parameters.every(
    (x, n) =>
      toSyntaxKind(parameterType[n]) === (x.type?.kind ?? ts.SyntaxKind.Unknown) ||
      isClassParameter(x, parameterType[n]),
  );

  if (!isParametersValid) {
    return false;
  }

  if (node.type?.kind !== toSyntaxKind(returnType)) {
    return false;
  }

  return true;
}

export function requireFunctionValidator(
  name: string,
  parameterType: string[],
  returnType: string,
) {
  return (tree: ts.SourceFile): monaco.editor.IMarkerData[] => {
    let found = false;

    function visit(node: ts.Node) {
      if (found) {
        return;
      }

      if (
        ts.isFunctionDeclaration(node) &&
        isFunctionWithSignature(node, name, parameterType, returnType)
      ) {
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
            message: `Missing required 'function ${name}(${parameterType.join(', ')}): ${returnType}' function`,
            severity: monaco.MarkerSeverity.Error,
          },
        ];
  };
}
