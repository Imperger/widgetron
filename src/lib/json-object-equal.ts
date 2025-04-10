type SerializedType = string | number | boolean | JSONObject | JSONArray | null;

export type JSONObject = { [key: string]: SerializedType };

type JSONArray = SerializedType[];

export class JsonObjectComparator {
  static equal(obj1: JSONObject, obj2: JSONObject): boolean {
    if (obj1 === obj2) return true;

    if (typeof obj1 === typeof obj2 && typeof obj1 !== 'object') {
      return obj1 === obj2;
    }

    if (obj1 == null || obj2 == null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      return false;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (
        !keys2.includes(key) ||
        !JsonObjectComparator.equal(obj1[key] as JSONObject, obj2[key] as JSONObject)
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Recursively checks whether two JSON objects have the same shape.
   *
   * The "shape" means both objects must have the same property keys at each level of nesting.
   * Leaf values are not compared, only the structure. Arrays are considered equal in shape
   * only if both are arrays at the same key, but their contents are not compared.
   *
   * @param {JSONObject} obj1 - The first JSON object to compare.
   * @param {JSONObject} obj2 - The second JSON object to compare.
   * @returns {boolean} Returns `true` if both objects have the same shape, otherwise `false`.
   *
   * @example
   * JsonObjectComparator.equalShape({ a: 10 }, { a: 20 })) // true
   * JsonObjectComparator.equalShape({ a: [1] }, { a: [1, 2] })) // true
   */
  static equalShape(obj1: JSONObject, obj2: JSONObject): boolean {
    if (typeof obj1 !== 'object' && typeof obj2 !== 'object') {
      return true;
    }

    const keys1 = Object.keys(obj1 ?? {});
    const keys2 = Object.keys(obj2 ?? {});

    if (
      !(Array.isArray(obj1) && Array.isArray(obj2)) &&
      (keys1.length !== keys2.length || !keys1.every((key) => keys2.includes(key)))
    ) {
      return false;
    }

    return keys1.every((key) =>
      JsonObjectComparator.equalShape(obj1[key] as JSONObject, obj2[key] as JSONObject),
    );
  }
}
