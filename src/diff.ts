import pixelmatch from 'pixelmatch';

interface SvgSize {
  width: number;
  height: number;
}

function parseSvgSize(svgString: string): SvgSize {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svg = doc.documentElement;

  let width = parseFloat(svg.getAttribute('width') || '0');
  let height = parseFloat(svg.getAttribute('height') || '0');

  if (!width || !height) {
    const viewBox = svg.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(/\s+/);
      width = parseFloat(parts[2]) || 300;
      height = parseFloat(parts[3]) || 200;
    }
  }

  return { width: Math.ceil(width) || 300, height: Math.ceil(height) || 200 };
}

async function svgToCanvas(svgString: string, width: number, height: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error('Failed to render SVG to canvas'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
  });
}

export interface DiffResult {
  type: 'match';
  diffCanvas: HTMLCanvasElement;
  matchPercentage: number;
  diffPixels: number;
  totalPixels: number;
}

export interface SizeMismatchResult {
  type: 'size-mismatch';
  currentSize: SvgSize;
  expectedSize: SvgSize;
}

export async function computeDiff(currentSvg: string, expectedSvg: string): Promise<DiffResult | SizeMismatchResult> {
  const currentSize = parseSvgSize(currentSvg);
  const expectedSize = parseSvgSize(expectedSvg);

  if (currentSize.width !== expectedSize.width || currentSize.height !== expectedSize.height) {
    return { type: 'size-mismatch', currentSize, expectedSize };
  }

  const w = currentSize.width;
  const h = currentSize.height;

  const [currentCanvas, expectedCanvas] = await Promise.all([
    svgToCanvas(currentSvg, w, h),
    svgToCanvas(expectedSvg, w, h),
  ]);

  const pw = currentCanvas.width;
  const ph = currentCanvas.height;

  const currentCtx = currentCanvas.getContext('2d')!;
  const expectedCtx = expectedCanvas.getContext('2d')!;

  const currentData = currentCtx.getImageData(0, 0, pw, ph);
  const expectedData = expectedCtx.getImageData(0, 0, pw, ph);

  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = pw;
  diffCanvas.height = ph;
  const diffCtx = diffCanvas.getContext('2d')!;
  const diffData = diffCtx.createImageData(pw, ph);

  const diffPixels = pixelmatch(
    currentData.data,
    expectedData.data,
    diffData.data,
    pw,
    ph,
    { threshold: 0.1, includeAA: false },
  );

  diffCtx.putImageData(diffData, 0, 0);

  const totalPixels = pw * ph;
  const matchPercentage = ((totalPixels - diffPixels) / totalPixels) * 100;

  return { type: 'match', diffCanvas, matchPercentage, diffPixels, totalPixels };
}
