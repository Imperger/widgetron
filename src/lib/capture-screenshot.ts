export interface Screenshot {
  image: string;
  width: number;
  height: number;
}

export function captureScreenshot(): Screenshot | null {
  const video = document.querySelector('video');

  if (!video) {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');

  if (ctx === null) {
    return null;
  }

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return { image: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
}
