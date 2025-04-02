interface WorkerConstructor {
  new (otpions?: { name?: string }): Worker;
}

type UploadResolver = (uploaded: boolean) => void;
type ExecuteResolver = (result: unknown) => void;

interface PendingUploadAction {
  type: 'upload';
  resolver: UploadResolver;
}

interface PendingExecuteAction {
  type: 'execute';
  resolver: ExecuteResolver;
  rejector: (err: Error) => void;
  timeoutTimer: number;
}

interface ActionResponseId {
  requestId: number;
}

type PendingAction = ActionResponseId & (PendingUploadAction | PendingExecuteAction);

export type ActionResponse<T> = ActionResponseId & (T extends void ? object : { return: T });

export type UploadActionResponse = ActionResponse<boolean>;

/**
 * Wrapper for a worker, that maintain worker in working state in case of infinite loops
 */
export class SafeTaskRunner<T extends WorkerConstructor> {
  private nextRequestId = 0;
  private instance!: Worker;
  public timeout = 1000;
  private pendingActions: PendingAction[] = [];

  constructor(private readonly type: T) {
    this.setup();
  }

  async upload(sourceCode: string, async: boolean): Promise<boolean> {
    return new Promise<boolean>((resolver) => {
      const requestId = this.requestId();

      this.pendingActions.push({ requestId, type: 'upload', resolver });

      this.instance.postMessage({ requestId, type: 'upload', sourceCode, async });
    });
  }

  async execute<T extends unknown[]>(...args: T): Promise<unknown> {
    return new Promise<unknown>((resolver, rejector) => {
      const requestId = this.requestId();

      this.pendingActions.push({
        requestId,
        type: 'execute',
        resolver,
        rejector,
        timeoutTimer: setTimeout(() => this.onTimeout(), this.timeout),
      });

      this.instance.postMessage({ requestId, type: 'execute', args });
    });
  }

  terminate(): void {
    this.instance.terminate();
  }

  private setup(): void {
    this.instance = new this.type();

    this.instance.addEventListener('message', (e) => this.onMessage(e.data));
  }

  private onMessage(response: ActionResponse<unknown>): void {
    const actionIdx = this.pendingActions.findIndex((x) => x.requestId === response.requestId);

    if (actionIdx === -1) {
      throw new Error(`Got response with unexpected request id '${response.requestId}'`);
    }

    const action = this.pendingActions[actionIdx];

    if (action.type === 'upload') {
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
