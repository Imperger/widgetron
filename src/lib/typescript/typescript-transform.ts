import * as ts from 'typescript';

export class TypescriptTransformer {
  static removeExport(sourceCode: string): string {
    const parsed = ts.createSourceFile(
      'main.ts',
      sourceCode,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );

    const transformedResult = ts.transform(parsed, [
      TypescriptTransformer.removeExportTransformFactory,
    ]);

    const printer = ts.createPrinter();
    return printer.printFile(transformedResult.transformed[0] as ts.SourceFile);
  }

  private static removeExportTransformFactory(context: ts.TransformationContext) {
    return (rootNode: ts.Node) => {
      function visit(node: ts.Node): ts.Node {
        // Remove 'export' from interface declarations
        if (ts.isInterfaceDeclaration(node)) {
          return ts.factory.createInterfaceDeclaration(
            /* modifiers */ undefined, // Remove 'export'
            node.name,
            node.typeParameters,
            node.heritageClauses,
            node.members,
          );
        } else if (ts.isFunctionDeclaration(node)) {
          return ts.factory.createFunctionDeclaration(
            undefined, // No modifiers (removes "export")
            node.asteriskToken,
            node.name,
            node.typeParameters,
            node.parameters,
            node.type,
            node.body,
          );
        } else if (ts.isTypeAliasDeclaration(node)) {
          // Remove 'export' from type aliases
          return ts.factory.createTypeAliasDeclaration(
            undefined, // No modifiers (removes "export")
            node.name,
            node.typeParameters,
            node.type,
          );
        } else if (ts.isClassDeclaration(node)) {
          // Remove 'export' from classes
          return ts.factory.createClassDeclaration(
            undefined, // No modifiers
            node.name,
            node.typeParameters,
            node.heritageClauses,
            node.members,
          );
        } else if (ts.isVariableStatement(node)) {
          // Remove 'export' from variable declarations
          return ts.factory.createVariableStatement(
            undefined, // No modifiers
            node.declarationList,
          );
        } else if (ts.isEnumDeclaration(node)) {
          // Remove 'export' from enums
          return ts.factory.createEnumDeclaration(
            undefined, // No modifiers
            node.name,
            node.members,
          );
        } else if (ts.isModuleDeclaration(node)) {
          // Remove 'export' from "export declare module"
          return ts.factory.createModuleDeclaration(
            undefined, // No modifiers (removes "export")
            node.name,
            node.body,
            node.flags,
          );
        } else if (ts.isExportAssignment(node) || ts.isExportDeclaration(node)) {
          return ts.factory.createEmptyStatement();
        }
        return ts.visitEachChild(node, visit, context);
      }
      return ts.visitNode(rootNode, visit);
    };
  }
}
