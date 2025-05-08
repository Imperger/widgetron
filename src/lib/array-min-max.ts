export function arrayMinMax<T>(arr: T[], cmp = (a: T, b: T) => a < b): [T, T] {
  if (arr.length === 0) {
    throw new Error('Unexpected empty array');
  }

  let min = arr[0];
  let max = arr[0];

  for (const x of arr) {
    if (cmp(x, min)) {
      min = x;
    }

    if (cmp(max, x)) {
      max = x;
    }
  }

  return [min, max];
}
