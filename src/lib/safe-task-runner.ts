import { reinterpret_cast } from './reinterpret-cast';

interface WorkerConstructor {
  new (otpions?: { name?: string }): Worker;
}

type UploadResolver = (uploaded: boolean) => void;
type UnloadResolver = (uploaded: boolean) => void;
type ExecuteResolver = (result: unknown) => void;

interface PendingUploadAction {
  type: 'upload';
  resolver: UploadResolver;
}

interface PendingUnloadAction {
  type: 'unload';
  resolver: UnloadResolver;
}

interface PendingExecuteAction {
  type: 'execute';
  resolver: ExecuteResolver;
  rejector: (err: Error) => void;
  timeoutTimer: number;
}

interface ActionResponseId {
  requestId?: number;
}

type PendingAction = ActionResponseId &
  (PendingUploadAction | PendingUnloadAction | PendingExecuteAction);

export type ActionResponse<T> = ActionResponseId & (T extends void ? object : { return: T });

export type UploadActionResponse = ActionResponse<boolean>;

export type ExternalMessageListener<T> = (data: T) => void;

export type ExternalMessageListenerUnsubscriber = () => void;

interface ExecutionTarget<T extends unknown[]> {
  name: string;
  args: T;
}

/**
 * Wrapper for a worker, that maintain worker in working state in case of infinite loops
 */
export class SafeTaskRunner<T extends WorkerConstructor> {
  private nextRequestId = 0;
  private instance!: Worker;
  private pendingActions: PendingAction[] = [];
  private readonly externalMessageListeners: ExternalMessageListener<unknown>[] = [];

  constructor(private readonly type: T) {
    this.setup();
  }

  async upload(
    async: boolean,
    name: string,
    parameters: string[],
    sourceCode: string,
  ): Promise<boolean> {
    return new Promise<boolean>((resolver) => {
      const requestId = this.requestId();

      this.pendingActions.push({ requestId, type: 'upload', resolver });

      this.instance.postMessage({ requestId, type: 'upload', async, name, parameters, sourceCode });
    });
  }

  async unload(name: string): Promise<boolean> {
    return new Promise<boolean>((resolver) => {
      const requestId = this.requestId();

      this.pendingActions.push({ requestId, type: 'unload', resolver });

      this.instance.postMessage({ requestId, type: 'unload', name });
    });
  }

  async execute<T extends unknown[]>(
    { name, args }: ExecutionTarget<T>,
    timeout = 1000,
  ): Promise<unknown> {
    return new Promise<unknown>((resolver, rejector) => {
      const requestId = this.requestId();

      this.pendingActions.push({
        requestId,
        type: 'execute',
        resolver,
        rejector,
        timeoutTimer: setTimeout(() => this.onTimeout(), timeout),
      });

      this.instance.postMessage({ requestId, type: 'execute', args: [name, ...args] });
    });
  }

  subscribeToUnrecognizedMessages<T>(
    listener: ExternalMessageListener<T>,
  ): ExternalMessageListenerUnsubscriber {
    this.externalMessageListeners.push(
      reinterpret_cast<ExternalMessageListener<unknown>>(listener),
    );

    return () => {
      const idx = this.externalMessageListeners.indexOf(
        reinterpret_cast<ExternalMessageListener<unknown>>(listener),
      );

      if (idx !== -1) {
        this.externalMessageListeners.splice(idx, 1);
      }
    };
  }

  postMessage(message: unknown, transfer: Transferable[]): void {
    this.instance.postMessage(message, transfer);
  }

  terminate(): void {
    this.instance.terminate();
  }

  private setup(): void {
    this.instance = new this.type();

    this.instance.addEventListener('message', (e) => this.onMessage(e.data));
  }

  private onMessage(response: ActionResponse<unknown>): void {
    if (response.requestId === undefined) {
      this.externalMessageListeners.forEach((x) => x(response));

      return;
    }

    const actionIdx = this.pendingActions.findIndex((x) => x.requestId === response.requestId);

    if (actionIdx === -1) {
      throw new Error(`Got response with unexpected request id '${response.requestId}'`);
    }

    const action = this.pendingActions[actionIdx];

    if (action.type === 'upload' || action.type === 'unload') {
      action.resolver(response.return as boolean);
    } else if (action.type === 'execute') {
      clearTimeout(action.timeoutTimer);

      action.resolver(response.return);
    }

    this.pendingActions.splice(actionIdx, 1);
  }

  private onTimeout() {
    this.pendingActions.forEach((x) => {
      if (x.type === 'execute') {
        clearTimeout(x.timeoutTimer);

        x.rejector(new Error('Terminated by timeout'));
      }
    });

    this.instance.terminate();

    this.setup();
  }

  private requestId(): number {
    return this.nextRequestId++;
  }
}
