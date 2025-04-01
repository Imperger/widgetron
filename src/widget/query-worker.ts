import AppDb from '@/db/app-db';

export interface UploadCodeMessage {
  type: 'upload';
  requestId: number;
  sourceCode: string;
  async: boolean;
}

export interface ExecuteMessage {
  type: 'execute';
  requestId: number;
}

export type IncomingMessage = UploadCodeMessage | ExecuteMessage;

export type QueryFunction = (db: AppDb) => void | Promise<void>;

const db = new AppDb();
let queryFunction: QueryFunction | null = null;

self.onmessage = async (e: MessageEvent<IncomingMessage>) => {
  switch (e.data.type) {
    case 'upload':
      uploadSourceCode(e.data.sourceCode, e.data.async);

      self.postMessage({ requestId: e.data.requestId, return: true });
      break;
    case 'execute':
      const AsyncFunction = async function () {}.constructor;
      if (queryFunction instanceof AsyncFunction) {
        const result = await queryFunction(db);

        self.postMessage({ requestId: e.data.requestId, return: result });
      } else if (queryFunction instanceof Function) {
        const result = queryFunction(db);

        self.postMessage({ requestId: e.data.requestId, return: result });
      }
  }
};

function uploadSourceCode(sourceCode: string, async: boolean): void {
  const createFn = async ? async function () {}.constructor : Function;

  queryFunction = createFn('db', sourceCode) as QueryFunction;
}
