import * as ts from 'typescript';
import type { ImportGlobFunction } from 'vite/types/importGlob.js';

import { reinterpret_cast } from '../reinterpret-cast';

import { TypescriptExtractor } from './typescript-extractor';
import { TypescriptTransformer } from './typescript-transform';

interface SelectionRule {
  type: 'type' | 'interface' | 'class';
  name: string;
}

type TransformationRule = 'remove-export';

export class ExternalLibCache {
  private static dexieCode = '';
  private static widgetTypesCode = '';

  static async dexie(): Promise<string> {
    if (ExternalLibCache.dexieCode.length === 0) {
      ExternalLibCache.dexieCode = await ExternalLibCache.load(
        'dexie.d.ts',
        import.meta.glob('dexie/dist/dexie.d.ts', { as: 'raw' }),
        [],
        ['remove-export'],
      );
    }

    return ExternalLibCache.dexieCode;
  }

  static async widgetTypes(): Promise<string> {
    if (ExternalLibCache.widgetTypesCode.length === 0) {
      ExternalLibCache.widgetTypesCode = await ExternalLibCache.load(
        'message.ts',
        import.meta.glob('/src/db/message.ts', { as: 'raw' }),
        [{ type: 'class', name: 'Message' }],
        ['remove-export'],
      );

      ExternalLibCache.widgetTypesCode += await ExternalLibCache.load(
        'widget-source-code.ts',
        import.meta.glob('/src/db/widget-source-code.ts', { as: 'raw' }),
        [{ type: 'class', name: 'WidgetSourceCode' }],
        ['remove-export'],
      );

      ExternalLibCache.widgetTypesCode += await ExternalLibCache.load(
        'app-db.ts',
        import.meta.glob('/src/db/app-db.ts', { as: 'raw' }),
        [{ type: 'class', name: 'AppDB' }],
        ['remove-export'],
      );

      ExternalLibCache.widgetTypesCode += await ExternalLibCache.load(
        'widget-model-table.ts',
        import.meta.glob('/src/widget/model/widget-model-table.ts', { as: 'raw' }),
        [],
        ['remove-export'],
      );

      ExternalLibCache.widgetTypesCode += await ExternalLibCache.load(
        'widget-model-text.ts',
        import.meta.glob('/src/widget/model/widget-model-text.ts', { as: 'raw' }),
        [],
        ['remove-export'],
      );

      ExternalLibCache.widgetTypesCode += await ExternalLibCache.load(
        'widget-model-pie-chart.ts',
        import.meta.glob('/src/widget/model/widget-model-pie-chart.ts', { as: 'raw' }),
        [],
        ['remove-export'],
      );

      ExternalLibCache.widgetTypesCode += await ExternalLibCache.load(
        'widget-model.ts',
        import.meta.glob('/src/widget/model/widget-model.ts', { as: 'raw' }),
        [{ type: 'type', name: 'WidgetModel' }],
        ['remove-export'],
      );

      ExternalLibCache.widgetTypesCode += await ExternalLibCache.load(
        'ui-text-input.ts',
        import.meta.glob('/src/widget/input/ui-text-input.ts', { as: 'raw' }),
        [],
        ['remove-export'],
      );

      ExternalLibCache.widgetTypesCode += await ExternalLibCache.load(
        'ui-slider-input.ts',
        import.meta.glob('/src/widget/input/ui-slider-input.ts', { as: 'raw' }),
        [],
        ['remove-export'],
      );

      ExternalLibCache.widgetTypesCode += await ExternalLibCache.load(
        'ui-input-component.ts',
        import.meta.glob('/src/widget/input/ui-input-component.ts', { as: 'raw' }),
        [{ type: 'type', name: 'UIInputComponent' }],
        ['remove-export'],
      );

      ExternalLibCache.widgetTypesCode += await ExternalLibCache.load(
        'only-ui-input-properties.ts',
        import.meta.glob('/src/widget/input/only-ui-input-properties.ts', { as: 'raw' }),
        [{ type: 'interface', name: 'OnlyUIInputProperties' }],
        ['remove-export'],
      );

      ExternalLibCache.widgetTypesCode += await ExternalLibCache.load(
        'environment.ts',
        import.meta.glob('/src/widget/api/environment.ts', { as: 'raw' }),
        [],
        ['remove-export'],
      );

      ExternalLibCache.widgetTypesCode += await ExternalLibCache.load(
        'action.ts',
        import.meta.glob('/src/widget/api/action.ts', { as: 'raw' }),
        [],
        ['remove-export'],
      );

      ExternalLibCache.widgetTypesCode += await ExternalLibCache.load(
        'environment.ts',
        import.meta.glob('/src/widget/api/api.ts', { as: 'raw' }),
        [
          { type: 'interface', name: 'API' },
          { type: 'interface', name: 'ChatMessage' },
        ],
        ['remove-export'],
      );
    }

    return ExternalLibCache.widgetTypesCode;
  }

  private static async load(
    filename: string,
    importGlob: ReturnType<ImportGlobFunction>,
    selectors: SelectionRule[],
    transformers: TransformationRule[],
  ): Promise<string> {
    if (Object.keys(importGlob).length === 0) {
      throw new Error(
        `Failed to locate '${filename}'. Please verify the path or ensure the file has not been moved or deleted`,
      );
    }

    const sourceCode = await Object.values(
      importGlob as Record<string, () => Promise<string>>,
    )[0]();

    if (selectors.length === 0 && transformers.length === 0) {
      return sourceCode;
    }

    const sourceFile = ts.createSourceFile(filename, sourceCode, ts.ScriptTarget.ESNext, true);

    const samples =
      selectors.length === 0
        ? [sourceCode]
        : selectors.map((x) => ExternalLibCache.select(sourceFile, x));

    const missingSamplesStr = samples
      .reduce(
        (acc, x, n) => (x === null ? [...acc, `'${selectors[n].type} ${selectors[n].name}'`] : acc),
        reinterpret_cast<string[]>([]),
      )
      .join(', ');

    if (missingSamplesStr.length > 0) {
      throw new Error(`Failed to locate entries: ${missingSamplesStr}`);
    }

    return reinterpret_cast<string[]>(samples)
      .map((x) =>
        transformers.length === 0
          ? x
          : transformers.reduce((acc, t) => ExternalLibCache.transform(acc, t), x),
      )
      .join('\n');
  }

  private static select(sourceFile: ts.SourceFile, selector: SelectionRule): string | null {
    switch (selector.type) {
      case 'type':
        return TypescriptExtractor.typeAliasDeclaration(sourceFile, selector.name);
      case 'interface':
        return TypescriptExtractor.interfaceDeclaration(sourceFile, selector.name);
      case 'class':
        return TypescriptExtractor.classDefinition(sourceFile, selector.name);
    }
  }

  private static transform(sourceCode: string, rule: TransformationRule): string {
    switch (rule) {
      case 'remove-export':
        return TypescriptTransformer.removeExport(sourceCode);
    }
  }
}
