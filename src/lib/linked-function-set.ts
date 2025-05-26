// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

interface FunctionTemplate {
  async: boolean;
  name: string;
  parameters: string[];
  body: string;
}

interface Dependency {
  name: string;
  value: unknown;
}

/**
 * Represents a set of dynamically defined functions that are internally linked and can call each other.
 *
 * Functions are added as templates (with name, parameters, body, and async flag), and once composed,
 * they become callable by name. During composition, dependencies between functions are resolved automatically
 * based on parameter names, allowing functions in the set to reference each other.
 *
 * Usage:
 *  - Add function templates using `add()`.
 *  - Call `compose()` to compile and link all functions.
 *  - Use `call()` to invoke any function by name.
 *
 * Internally, all functions are wrapped and injected with dependencies as arguments.
 */
export class LinkedFunctionSet {
  private readonly functionTemplates: FunctionTemplate[] = [];
  private readonly wrappedFunctions = new Map<string, AnyFunction>();
  private wrappedArgs: (AnyFunction | null)[] = [];
  private readonly dependencies: Dependency[] = [];
  private isSealed = false;

  add(async: boolean, name: string, parameters: string[], body: string): void {
    if (this.isSealed) {
      throw new Error('Attempted to add function after compose() was called');
    }

    this.functionTemplates.push({ async, name, parameters, body });
  }

  addDependency(name: string, dependency: unknown): void {
    if (this.isSealed) {
      throw new Error('Attempted to add dependency after compose() was called');
    }

    this.dependencies.push({ name, value: dependency });
  }

  compose(): void {
    const dependencyList = [...this.functionTemplates.map((x) => x.name)];
    this.wrappedArgs = Array.from({ length: this.functionTemplates.length }, () => null);

    this.functionTemplates.forEach((fn, n) => this.wrapFn(fn, n, dependencyList));
    this.functionTemplates.length = 0;

    this.isSealed = true;
  }

  call<T extends AnyFunction>(fnName: string, ...args: Parameters<T>): ReturnType<T> {
    const fn = this.wrappedFunctions.get(fnName);

    if (fn === undefined) {
      throw new Error(`Unknown function '${fnName}' call`);
    }

    return fn(...args);
  }

  isAsync(fnName: string): boolean {
    const fn = this.wrappedFunctions.get(fnName);

    if (fn === undefined) {
      throw new Error(`Unknown function ${fnName}`);
    }

    const AsyncFunction = async function () {}.constructor;

    return fn instanceof AsyncFunction;
  }

  get sealed(): boolean {
    return this.isSealed;
  }

  private wrapFn(template: FunctionTemplate, idx: number, injectionList: string[]) {
    const createFn = template.async ? async function () {}.constructor : Function;

    const parameterSet = new Set<string>(template.parameters);

    const fn = createFn(
      ...template.parameters,
      ...injectionList.filter((x) => !parameterSet.has(x)),
      ...this.dependencies.map((x) => x.name),
      template.body,
    );

    const wrapper = template.async
      ? async (...args: unknown[]) =>
          fn(...args, ...this.wrappedArgs, ...this.dependencies.map((x) => x.value))
      : (...args: unknown[]) =>
          fn(...args, ...this.wrappedArgs, ...this.dependencies.map((x) => x.value));

    this.wrappedFunctions.set(template.name, wrapper);
    this.wrappedArgs[idx] = wrapper;

    return wrapper;
  }
}
