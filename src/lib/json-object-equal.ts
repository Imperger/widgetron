type SerializedType = string | number | boolean | JSONObject | JSONArray | null;

export type JSONObject = { [key: string]: SerializedType };

type JSONArray = SerializedType[];

export function jsonObjectEqual(obj1: JSONObject, obj2: JSONObject): boolean {
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
      !jsonObjectEqual(obj1[key] as JSONObject, obj2[key] as JSONObject)
    ) {
      return false;
    }
  }

  return true;
}
