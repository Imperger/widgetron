import type { WindowInstance } from './window-instance';

import { reinterpret_cast } from '@/lib/reinterpret-cast';
import type { UnionOmit } from '@/lib/union-omit';

export interface WindowManager<T extends WindowInstance> {
  setFocus(key: number): void;
  spawn(instance: UnionOmit<T, 'key'>): number;
  find<R extends T>(key: number): R | null;
  close(key: number): void;
  [Symbol.iterator](): Generator<T>;
}

export class WindowManagerExposed<T extends WindowInstance> implements WindowManager<T> {
  public nextKey = 0;
  public readonly instances: T[] = [];

  setFocus(key: number): void {
    if (this.instances[this.instances.length - 1].key === key) {
      return;
    }

    const foregroundWindow = this.instances.findIndex((x) => x.key === key);

    if (foregroundWindow === -1) {
      console.warn('Failed to set focus on a non-existent window');

      return;
    }

    this.instances.push(this.instances.splice(foregroundWindow, 1)[0]);
  }

  spawn(instance: UnionOmit<T, 'key'>): number {
    const key = this.nextKey++;

    this.instances.push(reinterpret_cast<T>({ ...instance, key }));

    return key;
  }

  find<R extends T>(key: number): R | null {
    return reinterpret_cast<R>(this.instances.find((x) => x.key === key)) ?? null;
  }

  close(key: number): void {
    const closeIdx = this.instances.findIndex((x) => x.key === key);

    if (closeIdx !== -1) {
      this.instances.splice(closeIdx, 1);
    }
  }

  [Symbol.iterator](): Generator<T> {
    return this.iterator();
  }

  *iterator(): Generator<T> {
    for (let n = 0; n < this.instances.length; n++) {
      yield this.instances[n];
    }
  }
}
