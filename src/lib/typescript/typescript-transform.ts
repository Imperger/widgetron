import { createSystem, createVirtualTypeScriptEnvironment } from '@typescript/vfs';
import * as ts from 'typescript';
import libEs2015Collection from 'typescript/lib/lib.es2015.collection.d.ts?raw';
import libEs2015Core from 'typescript/lib/lib.es2015.core.d.ts?raw';
import libEs2015Generator from 'typescript/lib/lib.es2015.generator.d.ts?raw';
import libEs2015Iterable from 'typescript/lib/lib.es2015.iterable.d.ts?raw';
import libEs2015Promise from 'typescript/lib/lib.es2015.promise.d.ts?raw';
import libEs2015Proxy from 'typescript/lib/lib.es2015.proxy.d.ts?raw';
import libEs2015Reflect from 'typescript/lib/lib.es2015.reflect.d.ts?raw';
import libEs2015Symbol from 'typescript/lib/lib.es2015.symbol.d.ts?raw';
import libEs2015SymbolWellknown from 'typescript/lib/lib.es2015.symbol.wellknown.d.ts?raw';
import libEs2016ArrayInclude from 'typescript/lib/lib.es2016.array.include.d.ts?raw';
import libEs2017Intl from 'typescript/lib/lib.es2017.intl.d.ts?raw';
import libEs2017Object from 'typescript/lib/lib.es2017.object.d.ts?raw';
import libEs2017SharedMemory from 'typescript/lib/lib.es2017.sharedmemory.d.ts?raw';
import libEs2017TypedArrays from 'typescript/lib/lib.es2017.typedarrays.d.ts?raw';
import libEs2018AsyncIterable from 'typescript/lib/lib.es2018.asynciterable.d.ts?raw';
import libEs2018Intl from 'typescript/lib/lib.es2018.intl.d.ts?raw';
import libEs2018Promise from 'typescript/lib/lib.es2018.promise.d.ts?raw';
import libEs2018Regexp from 'typescript/lib/lib.es2018.regexp.d.ts?raw';
import libEs2019Array from 'typescript/lib/lib.es2019.array.d.ts?raw';
import libEs2019Object from 'typescript/lib/lib.es2019.object.d.ts?raw';
import libEs2019String from 'typescript/lib/lib.es2019.string.d.ts?raw';
import libEs2019Symbol from 'typescript/lib/lib.es2019.symbol.d.ts?raw';
import libEs2020BigInt from 'typescript/lib/lib.es2020.bigint.d.ts?raw';
import libEs2020Intl from 'typescript/lib/lib.es2020.intl.d.ts?raw';
import libEs2020Promise from 'typescript/lib/lib.es2020.promise.d.ts?raw';
import libEs2020SharedMemory from 'typescript/lib/lib.es2020.sharedmemory.d.ts?raw';
import libEs2020String from 'typescript/lib/lib.es2020.string.d.ts?raw';
import libEs2020SymbolWellknown from 'typescript/lib/lib.es2020.symbol.wellknown.d.ts?raw';
import libEs2021Intl from 'typescript/lib/lib.es2021.intl.d.ts?raw';
import libEs2021Promise from 'typescript/lib/lib.es2021.promise.d.ts?raw';
import libEs2021String from 'typescript/lib/lib.es2021.string.d.ts?raw';
import libEs2021WeakRef from 'typescript/lib/lib.es2021.weakref.d.ts?raw';
import libEs2022Array from 'typescript/lib/lib.es2022.array.d.ts?raw';
import libEs2022Error from 'typescript/lib/lib.es2022.error.d.ts?raw';
import libEs2022Full from 'typescript/lib/lib.es2022.full.d.ts?raw';
import libEs2022Intl from 'typescript/lib/lib.es2022.intl.d.ts?raw';
import libEs2022Object from 'typescript/lib/lib.es2022.object.d.ts?raw';
import libEs2022Regexp from 'typescript/lib/lib.es2022.regexp.d.ts?raw';
import libEs2022String from 'typescript/lib/lib.es2022.string.d.ts?raw';
import libEs5 from 'typescript/lib/lib.es5.d.ts?raw';

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

  static declarationOnly(sourceCode: string): string {
    const filename = 'main.ts';

    const fsMap = new Map<string, string>();

    fsMap.set('/lib.es5.d.ts', libEs5);
    fsMap.set('/lib.es2015.core.d.ts', libEs2015Core);
    fsMap.set('/lib.es2015.collection.d.ts', libEs2015Collection);
    fsMap.set('/lib.es2015.generator.d.ts', libEs2015Generator);
    fsMap.set('/lib.es2015.iterable.d.ts', libEs2015Iterable);
    fsMap.set('/lib.es2015.promise.d.ts', libEs2015Promise);
    fsMap.set('/lib.es2015.proxy.d.ts', libEs2015Proxy);
    fsMap.set('/lib.es2015.reflect.d.ts', libEs2015Reflect);
    fsMap.set('/lib.es2015.symbol.d.ts', libEs2015Symbol);
    fsMap.set('/lib.es2015.symbol.wellknown.d.ts', libEs2015SymbolWellknown);

    fsMap.set('/lib.es2016.array.include.d.ts', libEs2016ArrayInclude);
    fsMap.set('/lib.es2017.object.d.ts', libEs2017Object);
    fsMap.set('/lib.es2017.sharedmemory.d.ts', libEs2017SharedMemory);
    fsMap.set('/lib.es2017.intl.d.ts', libEs2017Intl);
    fsMap.set('/lib.es2017.typedarrays.d.ts', libEs2017TypedArrays);

    fsMap.set('/lib.es2018.intl.d.ts', libEs2018Intl);
    fsMap.set('/lib.es2018.promise.d.ts', libEs2018Promise);
    fsMap.set('/lib.es2018.asynciterable.d.ts', libEs2018AsyncIterable);
    fsMap.set('/lib.es2018.regexp.d.ts', libEs2018Regexp);

    fsMap.set('/lib.es2019.array.d.ts', libEs2019Array);
    fsMap.set('/lib.es2019.object.d.ts', libEs2019Object);
    fsMap.set('/lib.es2019.string.d.ts', libEs2019String);
    fsMap.set('/lib.es2019.symbol.d.ts', libEs2019Symbol);

    fsMap.set('/lib.es2020.bigint.d.ts', libEs2020BigInt);
    fsMap.set('/lib.es2020.intl.d.ts', libEs2020Intl);
    fsMap.set('/lib.es2020.promise.d.ts', libEs2020Promise);
    fsMap.set('/lib.es2020.sharedmemory.d.ts', libEs2020SharedMemory);
    fsMap.set('/lib.es2020.string.d.ts', libEs2020String);
    fsMap.set('/lib.es2020.symbol.wellknown.d.ts', libEs2020SymbolWellknown);

    fsMap.set('/lib.es2021.intl.d.ts', libEs2021Intl);
    fsMap.set('/lib.es2021.promise.d.ts', libEs2021Promise);
    fsMap.set('/lib.es2021.string.d.ts', libEs2021String);
    fsMap.set('/lib.es2021.weakref.d.ts', libEs2021WeakRef);

    fsMap.set('/lib.es2022.array.d.ts', libEs2022Array);
    fsMap.set('/lib.es2022.error.d.ts', libEs2022Error);
    fsMap.set('/lib.es2022.intl.d.ts', libEs2022Intl);
    fsMap.set('/lib.es2022.object.d.ts', libEs2022Object);
    fsMap.set('/lib.es2022.regexp.d.ts', libEs2022Regexp);
    fsMap.set('/lib.es2022.string.d.ts', libEs2022String);
    fsMap.set('/lib.es2022.full.d.ts', libEs2022Full);

    fsMap.set(filename, sourceCode);

    const system = createSystem(fsMap);
    const env = createVirtualTypeScriptEnvironment(system, [filename], ts, {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      declaration: true,
      emitDeclarationOnly: true,
      lib: [
        'lib.es5.d.ts',
        'lib.es2015.core.d.ts',
        'lib.es2015.collection.d.ts',
        'lib.es2015.iterable.d.ts',
        'lib.es2015.promise.d.ts',
        'lib.es2015.symbol.d.ts',
        'lib.es2015.symbol.wellknown.d.ts',
        'lib.es2016.array.include.d.ts',
        'lib.es2017.object.d.ts',
        'lib.es2017.typedarrays.d.ts',
        'lib.es2018.promise.d.ts',
        'lib.es2018.asynciterable.d.ts',
        'lib.es2019.array.d.ts',
        'lib.es2020.promise.d.ts',
        'lib.es2021.promise.d.ts',
        'lib.es2022.array.d.ts',
        'lib.es2022.object.d.ts',
        'lib.es2022.full.d.ts',
      ],
    });

    const output: string[] = [];
    const emitResult = env.languageService.getEmitOutput(filename);

    if (emitResult.emitSkipped) {
      throw new Error('Emit skipped');
    }

    for (const outputFile of emitResult.outputFiles) {
      if (outputFile.name.endsWith('.d.ts')) {
        output.push(outputFile.text);
      }
    }

    return output.join('\n');
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
