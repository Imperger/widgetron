import * as ts from 'typescript';

import { TypescriptExtractor } from './typescript-extractor';
import { TypescriptTransformer } from './typescript-transform';

export class ExternalLibCache {
  private static dexieCode = '';
  private static appDBCode = '';
  private static widgetmodelCode = '';

  static async dexie(): Promise<string> {
    if (this.dexieCode.length === 0) {
      const files = import.meta.glob('dexie/dist/dexie.d.ts', { as: 'raw' });
      const file = Object.values(files)[0];
      ExternalLibCache.dexieCode = TypescriptTransformer.removeExport(await file());
    }

    return ExternalLibCache.dexieCode;
  }

  static async appDB(): Promise<string> {
    if (this.appDBCode.length === 0) {
      {
        const messageFiles = import.meta.glob('/src/db/message.ts', { as: 'raw' });

        if (Object.keys(messageFiles).length === 0) {
          throw new Error(
            "Failed to locate 'message.ts'. Please verify the path or ensure the file has not been moved or deleted",
          );
        }

        const sourceCode = await Object.values(messageFiles)[0]();

        const sourceFile = ts.createSourceFile(
          'message.ts',
          sourceCode,
          ts.ScriptTarget.ESNext,
          true,
        );

        const messageSourceCode = TypescriptExtractor.classDefinition(sourceFile, 'Message');

        if (messageSourceCode === null) {
          throw new Error("Failed to find 'Message' class definition");
        }

        ExternalLibCache.appDBCode = TypescriptTransformer.removeExport(messageSourceCode);
      }

      {
        const appDbFiles = import.meta.glob('/src/db/app-db.ts', { as: 'raw' });

        if (Object.keys(appDbFiles).length === 0) {
          throw new Error(
            "Failed to locate 'app-db.ts'. Please verify the path or ensure the file has not been moved or deleted",
          );
        }

        const sourceCode = await Object.values(appDbFiles)[0]();

        const sourceFile = ts.createSourceFile(
          'app-db.ts.ts',
          sourceCode,
          ts.ScriptTarget.ESNext,
          true,
        );

        const appDBSourceCode = TypescriptExtractor.classDefinition(sourceFile, 'AppDB');

        if (appDBSourceCode === null) {
          throw new Error('Failed to find AppDB class definition');
        }

        ExternalLibCache.appDBCode += TypescriptTransformer.removeExport(appDBSourceCode);
      }
    }

    return ExternalLibCache.appDBCode;
  }

  static async widgetModel(): Promise<string> {
    if (this.widgetmodelCode.length === 0) {
      {
        const files = import.meta.glob('/src/widget/model/widget-model-table.ts', { as: 'raw' });
        const file = Object.values(files)[0];

        ExternalLibCache.widgetmodelCode = TypescriptTransformer.removeExport(await file());
      }
      {
        const widgetModelFiles = import.meta.glob('/src/widget/model/widget-model.ts', {
          as: 'raw',
        });

        if (Object.keys(widgetModelFiles).length === 0) {
          throw new Error(
            "Failed to locate 'widget-model.ts. Please verify the path or ensure the file has not been moved or deleted",
          );
        }

        const sourceCode = await Object.values(widgetModelFiles)[0]();

        const sourceFile = ts.createSourceFile(
          'widget-model.ts',
          sourceCode,
          ts.ScriptTarget.ESNext,
          true,
        );

        const widgetModelSourceCode = TypescriptExtractor.typeAliasDeclaration(
          sourceFile,
          'WidgetModel',
        );

        if (widgetModelSourceCode === null) {
          throw new Error("Failed to find 'WidgetModel' type alias");
        }

        ExternalLibCache.widgetmodelCode +=
          TypescriptTransformer.removeExport(widgetModelSourceCode);
      }
    }

    return ExternalLibCache.widgetmodelCode;
  }
}
