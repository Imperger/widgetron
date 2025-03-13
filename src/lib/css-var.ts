export function cssVar(name: string): string | null {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`) ?? null;
}
