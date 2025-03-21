import { TypescriptTransformer } from './typescript-transform';

export class ExternalLibCache {
  private static dexieCode: string = '';

  static async dexie(): Promise<string> {
    if (this.dexieCode.length === 0) {
      const files = import.meta.glob('dexie/dist/dexie.d.ts', { as: 'raw' });
      const file = Object.values(files)[0];
      ExternalLibCache.dexieCode = TypescriptTransformer.removeExport(await file());
    }

    return ExternalLibCache.dexieCode;
  }
}
