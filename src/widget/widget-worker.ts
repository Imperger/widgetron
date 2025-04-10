import type { API } from './api/api';
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
  args: [OnlyUIInputProperties, API];
}

export type IncomingMessage = UploadCodeMessage | ExecuteMessage;

export type QueryFunction = (
  input: OnlyUIInputProperties,
  api: API,
) => WidgetModel | Promise<WidgetModel>;

const db = new AppDb();
let updateFunction: QueryFunction | null = null;

self.onmessage = async (e: MessageEvent<IncomingMessage>) => {
  switch (e.data.type) {
    case 'upload':
      uploadSourceCode(e.data.async, e.data.parameters, e.data.sourceCode);

      self.postMessage({ requestId: e.data.requestId, return: true });
      break;
    case 'execute':
      const AsyncFunction = async function () {}.constructor;
      if (updateFunction instanceof AsyncFunction) {
        const model = await updateFunction(e.data.args[0], { ...e.data.args[1], db });

        self.postMessage({
          requestId: e.data.requestId,
          return: { model, input: e.data.args[0] },
        });
      } else if (updateFunction instanceof Function) {
        const model = updateFunction(e.data.args[0], { ...e.data.args[1], db });

        self.postMessage({
          requestId: e.data.requestId,
          return: { model, input: e.data.args[0] },
        });
      }
  }
};

function uploadSourceCode(async: boolean, parameters: string[], sourceCode: string): void {
  const createFn = async ? async function () {}.constructor : Function;

  updateFunction = createFn(...parameters, sourceCode) as QueryFunction;
}
