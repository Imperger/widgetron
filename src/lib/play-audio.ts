export function playAudio(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio(url);

    const cleanup = () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };

    const onEnded = () => {
      cleanup();
      resolve(true);
    };

    const onError = () => {
      cleanup();
      resolve(false);
    };

    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    audio.play().catch(() => {
      cleanup();
      resolve(false);
    });
  });
}
