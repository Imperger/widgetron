import type { Action } from './api/action';
import type { API } from './api/api';
import { MessagesAfterLastTick } from './messages-after-last-tick';

import AppDb from '@/db/app-db';
import { autovivify, isUndefined } from '@/lib/autovivify';
import { FixedQueue } from '@/lib/fixed-queue';

interface UploadCodeMessage {
  type: 'upload';
  requestId: number;
  sourceCode: string;
  async: boolean;
  name: string;
  parameters: string[];
}

interface UnloadCodeMessage {
  type: 'unload';
  requestId: number;
  name: string;
}

type FunctionName = string;

interface ExecuteMessage {
  type: 'execute';
  requestId: number;
  args: [FunctionName, ...unknown[]];
}

type IncomingMessage = UploadCodeMessage | UnloadCodeMessage | ExecuteMessage;

interface ExtraType {
  type: unknown;
  name: string;
}

type Callable = (...args: unknown[]) => unknown;

interface FunctionRecord {
  name: string;
  parameters: string[];
  fn: Callable;
}

type ArgumentName = string;
type Argument<T = unknown> = [ArgumentName, T];

const db = new AppDb();

const functionRegistry: FunctionRecord[] = [];

const emitAction = (action: 'sendMessage' | 'deleteMessage' | 'banUser', ...args: unknown[]) =>
  self.postMessage({ action, args });

const allMessagesAfterLastTick = new MessagesAfterLastTick(db);
const channelMessagesAfterLastTick = new MessagesAfterLastTick(db);

const sessionState = autovivify();

self.onmessage = async (e: MessageEvent<IncomingMessage>) => {
  const extraTypes: ExtraType[] = [{ type: FixedQueue, name: 'FixedQueue' }];

  switch (e.data.type) {
    case 'upload':
      uploadSourceCode(
        e.data.async,
        e.data.name,
        [...e.data.parameters, ...extraTypes.map((x) => x.name)],
        e.data.sourceCode,
      );

      self.postMessage({ requestId: e.data.requestId, return: true });
      break;
    case 'unload':
      self.postMessage({ requestId: e.data.requestId, return: unloadSourceCode(e.data.name) });
      break;
    case 'execute':
      const AsyncFunction = async function () {}.constructor;
      const [fnName] = e.data.args;

      const fnRecord = functionRegistry.find((x) => x.name === fnName);

      if (fnRecord === undefined) {
        throw new Error(`Failed to execute unknown function '${fnName}'`);
      }

      const action: Action = {
        sendMessage: (text: string) => emitAction('sendMessage', text),
        deleteMessage: (messageId: string) => emitAction('deleteMessage', messageId),
        banUser: (bannedUserLogin: string, expiresIn: string, reason = '') =>
          emitAction('banUser', bannedUserLogin, expiresIn, reason),
      };

      const incomingArgs = incomingArguments(fnRecord.parameters, e.data);

      const outerAPIArgument = findArgument<Pick<API, 'env'>>('api', incomingArgs)!;
      const outerAPI = outerAPIArgument[1];

      const apiMethods = {
        allMessagesAfterLastTick: () => allMessagesAfterLastTick.call(() => true),
        channelMessagesAfterLastTick: () =>
          channelMessagesAfterLastTick.call(
            (x) => x.roomDisplayName === outerAPI.env.channel?.name,
          ),
        isUndefined,
      };

      const api: API = {
        ...outerAPI,
        db,
        action,
        ...apiMethods,
        state: sessionState,
      };

      outerAPIArgument[1] = api;

      const extraTypesArgs = extraTypes.map((x) => x.type);
      const knownArgs = [...incomingArgs, ...extraTypes.map((x) => [x.name, x.type] as Argument)];
      const fnArgs = matchArguments(fnRecord, knownArgs);

      const fn = fnRecord.fn.bind(null, ...fnArgs, ...extraTypesArgs);

      allMessagesAfterLastTick.enterTick();
      channelMessagesAfterLastTick.enterTick();

      let result: unknown = null;
      if (fn instanceof AsyncFunction) {
        result = await fn();
      } else if (fn instanceof Function) {
        result = fn();
      }

      if (fnName === 'onUpdate') {
        self.postMessage({
          requestId: e.data.requestId,
          return: { model: result, input: findArgument('input', knownArgs)![1] },
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
  }
};

function uploadSourceCode(
  async: boolean,
  name: string,
  parameters: string[],
  sourceCode: string,
): void {
  const createFn = async ? async function () {}.constructor : Function;

  const record = { name, parameters, fn: createFn(...parameters, sourceCode) };
  const fnIdx = functionRegistry.findIndex((x) => x.name === name);

  if (fnIdx === -1) {
    functionRegistry.push(record);
  } else {
    functionRegistry[fnIdx] = record;
  }
}

function unloadSourceCode(name: string): boolean {
  const unloadIdx = functionRegistry.findIndex((x) => x.name === name);
  if (unloadIdx !== -1) {
    functionRegistry.splice(unloadIdx, 1);

    return true;
  }

  return false;
}

function matchArguments(fnRecord: FunctionRecord, argsRegistry: Argument[]): unknown[] {
  return fnRecord.parameters.map((p) => {
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
