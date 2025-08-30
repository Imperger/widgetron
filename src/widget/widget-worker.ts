import type { Action } from './api/action';
import type { API } from './api/api';
import { MessagesAfterLastTick } from './messages-after-last-tick';

import AppDb from '@/db/app-db';
import { autovivify, isUndefined } from '@/lib/autovivify';
import type { Screenshot, ScreenshotFormat } from '@/lib/capture-screenshot';
import { FixedQueue } from '@/lib/fixed-queue';
import type { ViewerChannelRelationship } from '@/twitch/viewer-channel-relationship';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

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

interface Relationship {
  type: 'relationship';
  requestId: number;
  relationship: ViewerChannelRelationship;
  viewer: string;
  channel: string;
  args: [string, string];
}

interface PlayAudio {
  type: 'playAudio';
  requestId: number;
  success: boolean;
}

type IncomingMessage =
  | UploadCodeMessage
  | ExecuteMessage
  | CaptureScreenshot
  | SetGlobalScopeFunctionNames
  | Relationship
  | PlayAudio;

type ArgumentName = string;
type Argument<T = unknown> = [ArgumentName, T];

const db = new AppDb();

const parametersCache = new Map<string, string[]>();

const emitAction = (
  action:
    | 'sendMessage'
    | 'deleteMessage'
    | 'banUser'
    | 'captureScreenshot'
    | 'relationship'
    | 'playAudio',
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

type RelationshipResolver = (relationship: ViewerChannelRelationship | null) => void;

interface RelationshipPendingBlock {
  resolver: RelationshipResolver;
  viewer: string;
  channel: string;
}

const relationshipResolver: RelationshipPendingBlock[] = [];

async function relationship(
  viewer: string,
  channel: string,
): Promise<ViewerChannelRelationship | null> {
  return new Promise((resolver) => {
    relationshipResolver.push({ viewer, channel, resolver });

    emitAction('relationship', viewer, channel);
  });
}

type PlayAudioResolver = (success: boolean) => void;

interface PlayAudioResolverBlock {
  resolver: PlayAudioResolver;
  requestId: number;
}

let nextPlayAudioRequestId = 1;

const playAudioResolver: PlayAudioResolverBlock[] = [];

async function playAudio(url: string): Promise<boolean> {
  return new Promise((resolver) => {
    const requestId = nextPlayAudioRequestId++;

    playAudioResolver.push({ requestId, resolver });

    emitAction('playAudio', requestId, url);
  });
}

const allMessagesAfterLastTick = new MessagesAfterLastTick(db);
const channelMessagesAfterLastTick = new MessagesAfterLastTick(db);

const sessionState = autovivify();

const AsyncFunction = async function () {}.constructor;

Object.defineProperty(self, 'FixedQueue', {
  value: FixedQueue,
  writable: true,
  enumerable: true,
  configurable: true,
});

self.onmessage = async (e: MessageEvent<IncomingMessage>) => {
  switch (e.data.type) {
    case 'upload':
      defineFunction(e.data.async, e.data.name, [...e.data.parameters], e.data.sourceCode);

      parametersCache.set(e.data.name, e.data.parameters);

      self.postMessage({ requestId: e.data.requestId, return: true });
      break;
    case 'execute':
      const [fnName] = e.data.args;

      const fn: AnyFunction = Reflect.get(self, fnName);
      const fnParameters = parametersCache.get(fnName);

      if (fn === undefined || fnParameters === undefined) {
        throw new Error(`Failed to execute unknown function '${fnName}'`);
      }

      const incomingArgs = incomingArguments(fnParameters, e.data);

      assembleAPIArgument(incomingArgs);

      const fnArgs = matchArguments(fnParameters, incomingArgs);

      allMessagesAfterLastTick.enterTick();
      channelMessagesAfterLastTick.enterTick();

      let result: unknown = null;
      if (fn instanceof AsyncFunction) {
        result = await fn(...fnArgs);
      } else if (fn instanceof Function) {
        result = fn(...fnArgs);
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
    case 'relationship': {
      const viewer = e.data.viewer;
      const channel = e.data.channel;

      const blockIdx = relationshipResolver.findIndex(
        (x) => x.viewer === viewer && x.channel === channel,
      );

      relationshipResolver[blockIdx].resolver(e.data.relationship);

      relationshipResolver.splice(blockIdx, 1);
      break;
    }
    case 'playAudio': {
      const requestId = e.data.requestId;

      const blockIdx = playAudioResolver.findIndex((x) => x.requestId === requestId);

      playAudioResolver[blockIdx].resolver(e.data.success);

      playAudioResolver.splice(blockIdx, 1);
      break;
    }
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

function assembleAPIArgument(incomingArgs: Argument<unknown>[]): void {
  const action: Action = {
    sendMessage: (text: string) => emitAction('sendMessage', text),
    deleteMessage: (messageId: string) => emitAction('deleteMessage', messageId),
    banUser: (bannedUserLogin: string, expiresIn: string, reason = '') =>
      emitAction('banUser', bannedUserLogin, expiresIn, reason),
  };

  const outerAPIArgument = findArgument<Pick<API, 'env' | 'caller'>>('api', incomingArgs);

  if (outerAPIArgument === null) {
    return;
  }

  const outerAPI = outerAPIArgument[1];

  const apiMethods = {
    allMessagesAfterLastTick: () => allMessagesAfterLastTick.call(() => true),
    channelMessagesAfterLastTick: () =>
      channelMessagesAfterLastTick.call((x) => x.roomDisplayName === outerAPI.env.channel?.name),
    isUndefined,
    captureScreenshot,
    relationship,
    playAudio,
  };

  const api: API = {
    ...outerAPI,
    db,
    action,
    ...apiMethods,
    state: sessionState,
  };

  outerAPIArgument[1] = api;
}

function defineFunction(
  async: boolean,
  name: string,
  parameters: string[],
  sourceCode: string,
): void {
  const createFn = async ? AsyncFunction : Function;

  Object.defineProperty(self, name, {
    value: createFn(...parameters, sourceCode),
    writable: true,
    enumerable: true,
    configurable: true,
  });
}
