export interface UploadCodeMessage {
  type: 'upload';
  requestId: number;
  sourceCode: string;
  async: boolean;
}

export interface ExecuteMessage {
  type: 'execute';
  requestId: number;
  args: [];
}

export type IncomingMessage = UploadCodeMessage | ExecuteMessage;

export type EvalFunction = () => unknown | Promise<unknown>;

let evalFunction: EvalFunction | null = null;

self.onmessage = async (e: MessageEvent<IncomingMessage>) => {
  switch (e.data.type) {
    case 'upload':
      uploadSourceCode(e.data.sourceCode, e.data.async);

      self.postMessage({ requestId: e.data.requestId, return: true });
      break;
    case 'execute':
      const AsyncFunction = async function () {}.constructor;
      if (evalFunction instanceof AsyncFunction) {
        const result = await evalFunction();

        self.postMessage({ requestId: e.data.requestId, return: result });
      } else if (evalFunction instanceof Function) {
        const result = evalFunction();

        self.postMessage({ requestId: e.data.requestId, return: result });
      }
  }
};

function uploadSourceCode(sourceCode: string, async: boolean): void {
  const createFn = async ? async function () {}.constructor : Function;

  evalFunction = createFn(sourceCode) as EvalFunction;
}
