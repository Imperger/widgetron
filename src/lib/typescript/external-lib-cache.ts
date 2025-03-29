import * as ts from 'typescript';

import { TypescriptExtractor } from './typescript-extractor';
import { TypescriptTransformer } from './typescript-transform';

export class ExternalLibCache {
  private static dexieCode: string = '';
  private static appDBCode: string = '';

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
}
