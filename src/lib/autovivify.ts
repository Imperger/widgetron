import { reinterpret_cast } from './reinterpret-cast';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type LeafType = string | number | boolean | ObjectType | ArrayType | null | Function;

export type ObjectType = { [key: string | symbol]: LeafType };

type ArrayType = LeafType[];

const autogenerateTag = Symbol('autogenerate_tag');

export function autovivify<T extends ObjectType>(): T {
  return new Proxy<ObjectType>(reinterpret_cast<T>({ [autogenerateTag]: false }), {
    get: (target, prop) => {
      if (prop in target) {
        return target[prop];
      }

      target[prop] = autovivify();
      target[prop][autogenerateTag] = true;

      return target[prop];
    },

    set: (target, prop, value) => {
      if (prop === autogenerateTag) {
        return true;
      }

      if (!(prop in target)) {
        target[prop] = autovivify();
      }

      target[prop] = value;

      return true;
    },
  }) as T;
}

export function isUndefined(x: unknown): boolean {
  return x !== null && typeof x === 'object' && autogenerateTag in x;
}
