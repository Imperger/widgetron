export interface Screenshot {
  image: Uint8Array;
  width: number;
  height: number;
}

export async function captureScreenshot(): Promise<Screenshot | null> {
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

  return new Promise<Screenshot | null>((resolve) => {
    canvas.toBlob(async (blob) => {
      if (blob === null) {
        resolve(null);
        return;
      }

      resolve({
        image: new Uint8Array(await blob.arrayBuffer()),
        width: canvas.width,
        height: canvas.height,
      });
    }, 'image/png');
  });
}
