export function splitFirstN(str: string, delimiter: string, parts: number): string[] {
  const result: string[] = [];

  let searchStart = 0;
  while (--parts > 0) {
    const idx = str.indexOf(delimiter, searchStart);

    if (idx !== -1) {
      result.push(str.slice(searchStart, idx));
      searchStart = idx + delimiter.length;
    } else {
      break;
    }
  }

  result.push(str.slice(searchStart, str.length));

  return result;
}
