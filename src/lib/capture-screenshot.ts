export interface Screenshot {
  image: Uint8Array;
  width: number;
  height: number;
}

function toRgba(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): Screenshot {
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);

  return { image: new Uint8Array(image.data.buffer), width: image.width, height: image.height };
}

async function toPng(canvas: HTMLCanvasElement): Promise<Screenshot | null> {
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

export type ScreenshotFormat = 'rgba' | 'png';

export async function captureScreenshot(format: ScreenshotFormat): Promise<Screenshot | null> {
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

  switch (format) {
    case 'rgba':
      return toRgba(ctx, canvas);
    case 'png':
      return toPng(canvas);
  }
}
