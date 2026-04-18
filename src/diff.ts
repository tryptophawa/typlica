export interface DiffResult {
  diffCanvas: HTMLCanvasElement;
  matchPercentage: number;
  diffPixels: number;
  totalPixels: number;
}

// Per-channel difference threshold below which a pixel is considered "matching"
const MATCH_THRESHOLD = 8;

export function computeDiff(
  currentCanvas: HTMLCanvasElement,
  expectedCanvas: HTMLCanvasElement,
): DiffResult {
  const cw = currentCanvas.width, ch = currentCanvas.height;
  const ew = expectedCanvas.width, eh = expectedCanvas.height;
  const w = Math.max(cw, ew);
  const h = Math.max(ch, eh);

  const curCtx = currentCanvas.getContext('2d')!;
  const expCtx = expectedCanvas.getContext('2d')!;
  const curData = curCtx.getImageData(0, 0, cw, ch).data;
  const expData = expCtx.getImageData(0, 0, ew, eh).data;

  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = w;
  diffCanvas.height = h;
  const diffCtx = diffCanvas.getContext('2d')!;
  const diffImageData = diffCtx.createImageData(w, h);
  const out = diffImageData.data;

  let diffPixels = 0;
  const totalPixels = w * h;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const outIdx = (y * w + x) * 4;
      const inCur = x < cw && y < ch;
      const inExp = x < ew && y < eh;

      if (!inCur || !inExp) {
        // Non-overlapping region: semi-transparent orange
        out[outIdx]     = 255;
        out[outIdx + 1] = 100;
        out[outIdx + 2] = 0;
        out[outIdx + 3] = 200;
        diffPixels++;
        continue;
      }

      const ci = (y * cw + x) * 4;
      const ei = (y * ew + x) * 4;

      const dr = Math.abs(curData[ci]     - expData[ei]);
      const dg = Math.abs(curData[ci + 1] - expData[ei + 1]);
      const db = Math.abs(curData[ci + 2] - expData[ei + 2]);
      const maxDiff = Math.max(dr, dg, db);

      if (maxDiff <= MATCH_THRESHOLD) {
        // Matching pixel → fully transparent so checkerboard shows through
        out[outIdx + 3] = 0;
      } else {
        // Different pixel: amplify difference so even subtle changes are vivid
        const amp = Math.min(255, maxDiff * 4);
        out[outIdx]     = amp;
        out[outIdx + 1] = Math.round(amp * 0.2);
        out[outIdx + 2] = Math.round(amp * 0.2);
        out[outIdx + 3] = 255;
        diffPixels++;
      }
    }
  }

  diffCtx.putImageData(diffImageData, 0, 0);

  const matchPercentage = ((totalPixels - diffPixels) / totalPixels) * 100;
  return { diffCanvas, matchPercentage, diffPixels, totalPixels };
}

