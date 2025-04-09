import type { OnlyUIInputProperties } from './input/only-ui-input-properties';
import type { WidgetModel } from './model/widget-model';

import AppDb from '@/db/app-db';

export interface UploadCodeMessage {
  type: 'upload';
  requestId: number;
  sourceCode: string;
  async: boolean;
  parameters: string[];
}

export interface ExecuteMessage {
  type: 'execute';
  requestId: number;
  args: [OnlyUIInputProperties];
}

export type IncomingMessage = UploadCodeMessage | ExecuteMessage;

export type QueryFunction = (
  db: AppDb,
  input: OnlyUIInputProperties,
) => WidgetModel | Promise<WidgetModel>;

const db = new AppDb();
let queryFunction: QueryFunction | null = null;

self.onmessage = async (e: MessageEvent<IncomingMessage>) => {
  switch (e.data.type) {
    case 'upload':
      uploadSourceCode(e.data.async, e.data.parameters, e.data.sourceCode);

      self.postMessage({ requestId: e.data.requestId, return: true });
      break;
    case 'execute':
      const AsyncFunction = async function () {}.constructor;
      if (queryFunction instanceof AsyncFunction) {
        const result = await queryFunction(db, e.data.args[0]);

        self.postMessage({ requestId: e.data.requestId, return: result });
      } else if (queryFunction instanceof Function) {
        const result = queryFunction(db, e.data.args[0]);

        self.postMessage({ requestId: e.data.requestId, return: result });
      }
  }
};

function uploadSourceCode(async: boolean, parameters: string[], sourceCode: string): void {
  const createFn = async ? async function () {}.constructor : Function;

  queryFunction = createFn(...parameters, sourceCode) as QueryFunction;
}
