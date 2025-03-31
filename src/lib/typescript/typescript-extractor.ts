import * as ts from 'typescript';

export interface FunctionBody {
  async: boolean;
  body: string;
}

export class TypescriptExtractor {
  static functionBody(sourceFile: ts.SourceFile, functionName: string): FunctionBody | null {
    function findFunctionBody(node: ts.Node): FunctionBody | null {
      if (ts.isFunctionDeclaration(node) && node.name?.text === functionName && node.body) {
        const body = node.body.statements
          .map((stmt) => stmt.getFullText(sourceFile).trim())
          .join('\n');

        const async =
          node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword) ?? false;

        return { async, body };
      }

      return ts.forEachChild(node, findFunctionBody) ?? null;
    }

    return findFunctionBody(sourceFile);
  }

  static classDefinition(sourceFile: ts.SourceFile, className: string): string | null {
    function findClassDefinition(node: ts.Node): string | null {
      if (ts.isClassDeclaration(node) && node.name?.text === className) {
        return node.getText();
      }

      return ts.forEachChild(node, findClassDefinition) ?? null;
    }

    return findClassDefinition(sourceFile);
  }

  static interfaceDeclaration(sourceFile: ts.SourceFile, interfaceName: string): string | null {
    function findInterfaceDeclaration(node: ts.Node): string | null {
      if (ts.isInterfaceDeclaration(node) && node.name?.text === interfaceName) {
        return node.getText();
      }

      return ts.forEachChild(node, findInterfaceDeclaration) ?? null;
    }

    return findInterfaceDeclaration(sourceFile);
  }

  static typeAliasDeclaration(sourceFile: ts.SourceFile, interfaceName: string): string | null {
    function findTypeAliasDeclaration(node: ts.Node): string | null {
      if (ts.isTypeAliasDeclaration(node) && node.name?.text === interfaceName) {
        return node.getText();
      }

      return ts.forEachChild(node, findTypeAliasDeclaration) ?? null;
    }

    return findTypeAliasDeclaration(sourceFile);
  }
}
