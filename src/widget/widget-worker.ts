import type { Action } from './api/action';
import type { API } from './api/api';
import type { OnlyUIInputProperties } from './input/only-ui-input-properties';
import { MessagesAfterLastTick } from './messages-after-last-tick';
import type { WidgetModel } from './model/widget-model';

import AppDb from '@/db/app-db';
import { autovivify, isUndefined } from '@/lib/autovivify';
import { FixedQueue } from '@/lib/fixed-queue';
import { reinterpret_cast } from '@/lib/reinterpret-cast';

export interface UploadCodeMessage {
  type: 'upload';
  requestId: number;
  sourceCode: string;
  async: boolean;
  parameters: string[];
}

export interface ExecuteonUISetupMessage {
  type: 'execute';
  requestId: number;
  args: ['onUISetup', API];
}

export interface ExecuteOnUpdateMessage {
  type: 'execute';
  requestId: number;
  args: ['onUpdate', OnlyUIInputProperties, API];
}

export type IncomingMessage = UploadCodeMessage | ExecuteonUISetupMessage | ExecuteOnUpdateMessage;

export type UISetupFunction = (
  api: API,
  ...extra: unknown[]
) => OnlyUIInputProperties | Promise<OnlyUIInputProperties>;

export type UpdateFunction = (
  input: OnlyUIInputProperties,
  api: API,
  ...extra: unknown[]
) => WidgetModel | Promise<WidgetModel>;

interface ExtraType {
  type: unknown;
  name: string;
}

const db = new AppDb();
let uploadedFunction: UISetupFunction | UpdateFunction | null = null;

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
        [...e.data.parameters, ...extraTypes.map((x) => x.name)],
        e.data.sourceCode,
      );

      self.postMessage({ requestId: e.data.requestId, return: true });
      break;
    case 'execute':
      const AsyncFunction = async function () {}.constructor;

      const [type, arg0] = e.data.args;
      const action: Action = {
        sendMessage: (text: string) => emitAction('sendMessage', text),
        deleteMessage: (messageId: string) => emitAction('deleteMessage', messageId),
        banUser: (bannedUserLogin: string, expiresIn: string, reason = '') =>
          emitAction('banUser', bannedUserLogin, expiresIn, reason),
      };

      const outerAPI = APIFromArgs(e.data);

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

      const extraTypesArgs = extraTypes.map((x) => x.type);

      const fn =
        type === 'onUISetup'
          ? reinterpret_cast<UISetupFunction>(uploadedFunction)!.bind(null, api, ...extraTypesArgs)
          : reinterpret_cast<UpdateFunction>(uploadedFunction)!.bind(
              null,
              arg0,
              api,
              ...extraTypesArgs,
            );

      allMessagesAfterLastTick.enterTick();
      channelMessagesAfterLastTick.enterTick();

      let result: OnlyUIInputProperties | WidgetModel | null = null;
      if (uploadedFunction instanceof AsyncFunction) {
        result = await fn();
      } else if (uploadedFunction instanceof Function) {
        result = reinterpret_cast<OnlyUIInputProperties | WidgetModel>(fn());
      }

      if (type === 'onUISetup') {
        self.postMessage({
          requestId: e.data.requestId,
          return: result,
        });
      } else if (type === 'onUpdate') {
        self.postMessage({
          requestId: e.data.requestId,
          return: { model: result, input: arg0 },
        });
      }

      channelMessagesAfterLastTick.leaveTick();
      allMessagesAfterLastTick.leaveTick();

      break;
  }
};

function uploadSourceCode(async: boolean, parameters: string[], sourceCode: string): void {
  const createFn = async ? async function () {}.constructor : Function;

  uploadedFunction = createFn(...parameters, sourceCode) as UpdateFunction;
}

function APIFromArgs(msg: ExecuteonUISetupMessage | ExecuteOnUpdateMessage): API {
  switch (msg.args[0]) {
    case 'onUISetup':
      return msg.args[1];
    case 'onUpdate':
      return msg.args[2];
  }
}
