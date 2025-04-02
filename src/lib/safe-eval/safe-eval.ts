import { reinterpret_cast } from '../reinterpret-cast';
import { SafeTaskRunner } from '../safe-task-runner';

import EvalWorker from './eval-worker?worker&inline';

export async function safeEval<T>(
  sourceCode: string,
  async: boolean,
  timeout: number = 1000,
): Promise<T> {
  const worker = new SafeTaskRunner(EvalWorker);
  worker.timeout = timeout;

  try {
    if (!worker.upload(sourceCode, async)) {
      throw new Error('Failed to upload source code to the eval-worker');
    }

    return await reinterpret_cast<T>(worker.execute());
  } finally {
    worker.terminate();
  }
}
