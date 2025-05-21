import * as ts from 'typescript';

export interface FunctionBody {
  async: boolean;
  body: string;
}

interface ButtonDescriptor {
  id: string;
  startColumn: number;
  startLineNumber: number;
  endColumn: number;
  endLineNumber: number;
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

  static interfaceProperties(
    sourceFile: ts.SourceFile,
    interfaceName: string,
  ): Map<string, string> {
    const properties = new Map<string, string>();

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
        node.members.forEach((member) => {
          if (ts.isPropertySignature(member) && member.type) {
            properties.set(member.name.getText(), member.type.getText());
          }
        });
      }
    });

    return properties;
  }

  static globalScopeFunctionNames(sourceFile: ts.SourceFile): string[] {
    const functions: string[] = [];

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isFunctionDeclaration(node) && node.name) {
        functions.push(node.name.text);
      }
    });

    return functions;
  }

  static findButtonsInUIInput(tree: ts.SourceFile): ButtonDescriptor[] {
    const buttons: ButtonDescriptor[] = [];

    ts.forEachChild(tree, (node) => {
      if (ts.isInterfaceDeclaration(node) && node.name.text === 'UIInput') {
        node.members.forEach((member) => {
          if (ts.isPropertySignature(member) && member.type?.getText() === 'UIButton') {
            const start = tree.getLineAndCharacterOfPosition(member.getStart(tree));
            const end = tree.getLineAndCharacterOfPosition(member.getEnd());

            buttons.push({
              id: member.name.getText(),
              startLineNumber: start.line + 1,
              startColumn: start.character + 1,
              endLineNumber: end.line + 1,
              endColumn: end.character + 1,
            });
          }
        });
      }
    });

    return buttons;
  }
}
