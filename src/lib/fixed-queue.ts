export type DataProvider<T> = (idx: number) => T;

export class FixedQueue<T> {
  private data: T[];
  private writeIdx = 0;
  private readIdx = 0;
  private isFull = false;

  private constructor(capacity: number, provider: DataProvider<T>) {
    if (capacity <= 0) {
      throw new Error('Attempted to initialize with capacity <= 0');
    }

    this.data = Array.from({ length: capacity }, (_, n) => provider(n));
  }

  enqueue(value: T): void {
    this.data[this.writeIdx] = value;
    this.writeIdx = (this.writeIdx + 1) % this.capacity;

    if (this.isFull) {
      this.readIdx = (this.readIdx + 1) % this.capacity;
    }

    if (this.writeIdx === this.readIdx) {
      this.isFull = true;
    }
  }

  dequeue(): T {
    const result = this.data[this.readIdx];

    this.readIdx = (this.readIdx + 1) % this.capacity;

    this.isFull = false;

    return result;
  }

  peek(): T {
    return this.data[this.readIdx];
  }

  get size(): number {
    if (this.isFull) {
      return this.capacity;
    }

    return this.writeIdx >= this.readIdx
      ? this.writeIdx - this.readIdx
      : this.capacity - this.readIdx + this.writeIdx;
  }

  get isEmpty(): boolean {
    return this.size > 0;
  }

  get capacity(): number {
    return this.data.length;
  }

  toArray(): T[] {
    return [...this];
  }

  [Symbol.iterator]() {
    return this.iterator();
  }

  private *iterator(): Generator<T> {
    const size = this.size;

    for (let i = 0; i < size; i++) {
      yield this.data[(this.readIdx + i) % this.capacity];
    }
  }

  static create<T>(capacity: number, defaultValue: T): FixedQueue<T> {
    return new FixedQueue(capacity, () => defaultValue);
  }

  static fromArray<T>(array: T[], capacity?: number): FixedQueue<T> {
    if (array.length === 0) {
      throw new Error('Attempted to initialize from an empty array');
    }

    if (capacity === undefined) {
      const instance = new FixedQueue(array.length, (n) => array[n]);

      instance.isFull = true;

      return instance;
    } else {
      const instance = new FixedQueue(capacity, () => array[0]);

      array.forEach((x) => instance.enqueue(x));

      return instance;
    }
  }
}
