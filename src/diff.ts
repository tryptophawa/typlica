import pixelmatch from 'pixelmatch';

const COMPARE_WIDTH = 600;
const COMPARE_HEIGHT = 800;

async function svgToCanvas(svgString: string, width: number, height: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error('Failed to render SVG to canvas'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
  });
}

export interface DiffResult {
  diffCanvas: HTMLCanvasElement;
  matchPercentage: number;
  diffPixels: number;
  totalPixels: number;
}

export async function computeDiff(currentSvg: string, expectedSvg: string): Promise<DiffResult> {
  const [currentCanvas, expectedCanvas] = await Promise.all([
    svgToCanvas(currentSvg, COMPARE_WIDTH, COMPARE_HEIGHT),
    svgToCanvas(expectedSvg, COMPARE_WIDTH, COMPARE_HEIGHT),
  ]);

  const currentCtx = currentCanvas.getContext('2d')!;
  const expectedCtx = expectedCanvas.getContext('2d')!;

  const currentData = currentCtx.getImageData(0, 0, COMPARE_WIDTH, COMPARE_HEIGHT);
  const expectedData = expectedCtx.getImageData(0, 0, COMPARE_WIDTH, COMPARE_HEIGHT);

  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = COMPARE_WIDTH;
  diffCanvas.height = COMPARE_HEIGHT;
  const diffCtx = diffCanvas.getContext('2d')!;
  const diffData = diffCtx.createImageData(COMPARE_WIDTH, COMPARE_HEIGHT);

  const diffPixels = pixelmatch(
    currentData.data,
    expectedData.data,
    diffData.data,
    COMPARE_WIDTH,
    COMPARE_HEIGHT,
    { threshold: 0.1, includeAA: false },
  );

  diffCtx.putImageData(diffData, 0, 0);

  const totalPixels = COMPARE_WIDTH * COMPARE_HEIGHT;
  const matchPercentage = ((totalPixels - diffPixels) / totalPixels) * 100;

  return { diffCanvas, matchPercentage, diffPixels, totalPixels };
}
