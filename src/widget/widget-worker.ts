import type { Action } from './api/action';
import type { API } from './api/api';
import { MessagesAfterLastTick } from './messages-after-last-tick';

import AppDb from '@/db/app-db';
import { autovivify, isUndefined } from '@/lib/autovivify';
import type { Screenshot, ScreenshotFormat } from '@/lib/capture-screenshot';
import { FixedQueue } from '@/lib/fixed-queue';
import { LinkedFunctionSet } from '@/lib/linked-function-set';

interface UploadCodeMessage {
  type: 'upload';
  requestId: number;
  sourceCode: string;
  async: boolean;
  name: string;
  parameters: string[];
}

type FunctionName = string;

interface ExecuteMessage {
  type: 'execute';
  requestId: number;
  args: [FunctionName, ...unknown[]];
}

interface CaptureScreenshot extends Screenshot {
  type: 'captureScreenshot';
  args: [ScreenshotFormat];
}

interface SetGlobalScopeFunctionNames {
  type: 'setGlobalScopeFunctionNames';
  requestId: number;
  args: [string[]];
}

type IncomingMessage =
  | UploadCodeMessage
  | ExecuteMessage
  | CaptureScreenshot
  | SetGlobalScopeFunctionNames;

type ArgumentName = string;
type Argument<T = unknown> = [ArgumentName, T];

const db = new AppDb();

let functionRegistry = new LinkedFunctionSet();
const parametersCache = new Map<string, string[]>();

const emitAction = (
  action: 'sendMessage' | 'deleteMessage' | 'banUser' | 'captureScreenshot',
  ...args: unknown[]
) => self.postMessage({ action, args });

type CaptureScreenshotResolver = (screenshot: Screenshot) => void;

let captureScreenshotResolver: CaptureScreenshotResolver | null = null;

async function captureScreenshot(type: ScreenshotFormat): Promise<Screenshot> {
  return new Promise<Screenshot>((resolve) => {
    captureScreenshotResolver?.({ image: new Uint8Array(), width: 0, height: 0 });
    captureScreenshotResolver = resolve;

    emitAction('captureScreenshot', type);
  });
}

const allMessagesAfterLastTick = new MessagesAfterLastTick(db);
const channelMessagesAfterLastTick = new MessagesAfterLastTick(db);

let sessionState = autovivify();

self.onmessage = async (e: MessageEvent<IncomingMessage>) => {
  switch (e.data.type) {
    case 'upload':
      if (functionRegistry.sealed) {
        functionRegistry = new LinkedFunctionSet();
      }

      functionRegistry.add(e.data.async, e.data.name, [...e.data.parameters], e.data.sourceCode);
      parametersCache.set(e.data.name, e.data.parameters);

      self.postMessage({ requestId: e.data.requestId, return: true });
      break;
    case 'execute':
      if (!functionRegistry.sealed) {
        functionRegistry.addDependency('FixedQueue', FixedQueue);

        functionRegistry.compose();

        sessionState = autovivify();
      }

      const [fnName] = e.data.args;

      const fnParameters = parametersCache.get(fnName);

      if (fnParameters === undefined) {
        throw new Error(`Failed to execute unknown function '${fnName}'`);
      }

      const action: Action = {
        sendMessage: (text: string) => emitAction('sendMessage', text),
        deleteMessage: (messageId: string) => emitAction('deleteMessage', messageId),
        banUser: (bannedUserLogin: string, expiresIn: string, reason = '') =>
          emitAction('banUser', bannedUserLogin, expiresIn, reason),
      };

      const incomingArgs = incomingArguments(fnParameters, e.data);

      const outerAPIArgument = findArgument<Pick<API, 'env' | 'caller'>>('api', incomingArgs)!;
      const outerAPI = outerAPIArgument[1];

      const apiMethods = {
        allMessagesAfterLastTick: () => allMessagesAfterLastTick.call(() => true),
        channelMessagesAfterLastTick: () =>
          channelMessagesAfterLastTick.call(
            (x) => x.roomDisplayName === outerAPI.env.channel?.name,
          ),
        isUndefined,
        captureScreenshot,
      };

      const api: API = {
        ...outerAPI,
        db,
        action,
        ...apiMethods,
        state: sessionState,
      };

      outerAPIArgument[1] = api;

      const fnArgs = matchArguments(fnParameters, incomingArgs);

      allMessagesAfterLastTick.enterTick();
      channelMessagesAfterLastTick.enterTick();

      let result: unknown = null;
      if (functionRegistry.isAsync(fnName)) {
        result = await functionRegistry.call(fnName, ...fnArgs);
      } else {
        result = functionRegistry.call(fnName, ...fnArgs);
      }

      if (fnName === 'onUpdate') {
        self.postMessage({
          requestId: e.data.requestId,
          return: { model: result, input: findArgument('input', incomingArgs)![1] },
        });
      } else {
        self.postMessage({
          requestId: e.data.requestId,
          return: result,
        });
      }

      channelMessagesAfterLastTick.leaveTick();
      allMessagesAfterLastTick.leaveTick();

      break;
    case 'captureScreenshot':
      captureScreenshotResolver?.({
        image: e.data.image,
        width: e.data.width,
        height: e.data.height,
      });
      captureScreenshotResolver = null;
      break;
  }
};

function matchArguments(parameters: string[], argsRegistry: Argument[]): unknown[] {
  return parameters.map((p) => {
    const arg = argsRegistry.find((a) => a[0] === p);

    if (arg === undefined) {
      throw new Error(`Failed to substitute value for parameter '${p}'`);
    }

    return arg[1];
  });
}

function incomingArguments(parameters: string[], msg: ExecuteMessage): Argument[] {
  return msg.args.slice(1).map((a, n) => [parameters[n], a]);
}

function findArgument<T = unknown>(name: string, knownArguments: Argument[]): Argument<T> | null {
  return (knownArguments.find((x) => x[0] === name) as Argument<T>) ?? null;
}
