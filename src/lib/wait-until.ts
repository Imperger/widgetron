export async function waitUntil<T extends Node>(
  target: T,
  event: Parameters<T['addEventListener']>[0],
) {
  return new Promise<void>((resolve) =>
    target.addEventListener(event, () => resolve(), { once: true, passive: true }),
  );
}
