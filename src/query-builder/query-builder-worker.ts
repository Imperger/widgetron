import AppDb from '@/db/app-db';

export interface UploadCodeMessage {
  type: 'upload';
  sourceCode: string;
}

export interface ExecuteMessage {
  type: 'execute';
}

export type IncomingMessage = UploadCodeMessage | ExecuteMessage;

export type QueryFunction = (db: AppDb) => void;

const db = new AppDb();
let queryFunction: QueryFunction | null = null;

self.onmessage = (e: MessageEvent<IncomingMessage>) => {
  switch (e.data.type) {
    case 'upload':
      uploadSourceCode(e.data.sourceCode);
      break;
    case 'execute':
      queryFunction?.(db);
  }
};

function uploadSourceCode(sourceCode: string): void {
  queryFunction = new Function('db', sourceCode) as QueryFunction;
}
