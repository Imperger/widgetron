import { reinterpret_cast } from '../reinterpret-cast';
import { SafeTaskRunner } from '../safe-task-runner';

import EvalWorker from './eval-worker?worker&inline';

export interface SafeEvalArgs {
  parameter: string;
  value: unknown;
}

export async function safeEval<T>(
  async: boolean,
  args: SafeEvalArgs[],
  sourceCode: string,
  timeout: number = 1000,
): Promise<T> {
  const worker = new SafeTaskRunner(EvalWorker);
  worker.timeout = timeout;

  try {
    if (
      !(await worker.upload(
        async,
        args.map((x) => x.parameter),
        sourceCode,
      ))
    ) {
      throw new Error('Failed to upload source code to the eval-worker');
    }

    return await reinterpret_cast<T>(worker.execute(...args.map((x) => x.value)));
  } finally {
    worker.terminate();
  }
}
