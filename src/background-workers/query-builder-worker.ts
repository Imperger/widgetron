import AppDb from '@/db/app-db';

export interface UploadCodeMessage {
  type: 'upload';
  requestId: number;
  sourceCode: string;
}

export interface ExecuteMessage {
  type: 'execute';
  requestId: number;
}

export type IncomingMessage = UploadCodeMessage | ExecuteMessage;

export type QueryFunction = (db: AppDb) => void;

const db = new AppDb();
let queryFunction: QueryFunction | null = null;

self.onmessage = (e: MessageEvent<IncomingMessage>) => {
  switch (e.data.type) {
    case 'upload':
      uploadSourceCode(e.data.sourceCode);

      self.postMessage({ requestId: e.data.requestId, return: true });
      break;
    case 'execute':
      const result = queryFunction?.(db);

      self.postMessage({ requestId: e.data.requestId, return: result });
  }
};

function uploadSourceCode(sourceCode: string): void {
  queryFunction = new Function('db', sourceCode) as QueryFunction;
}
