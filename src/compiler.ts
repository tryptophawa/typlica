const COMPILER_WASM = 'https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-web-compiler@0.6.0/pkg/typst_ts_web_compiler_bg.wasm';
const RENDERER_WASM = 'https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-renderer@0.6.0/pkg/typst_ts_renderer_bg.wasm';

const PREAMBLE = `#set page(width: 300pt, height: auto, margin: 20pt)
#set text(size: 11pt)
`;

let initialized = false;

export async function initCompiler(): Promise<void> {
  if (initialized) return;

  await new Promise<void>((resolve, reject) => {
    if (typeof $typst !== 'undefined') {
      resolve();
      return;
    }
    const el = document.getElementById('typst');
    if (!el) {
      reject(new Error('typst script element not found'));
      return;
    }
    el.addEventListener('load', () => resolve());
    el.addEventListener('error', () => reject(new Error('Failed to load typst.ts')));
  });

  $typst.setCompilerInitOptions({ getModule: () => COMPILER_WASM });
  $typst.setRendererInitOptions({ getModule: () => RENDERER_WASM });

  // Warm up the compiler
  await $typst.svg({ mainContent: '' });
  initialized = true;
}

export async function compile(code: string): Promise<{ svg: string; error: null } | { svg: null; error: string }> {
  try {
    const svg = await $typst.svg({ mainContent: PREAMBLE + code });
    return { svg, error: null };
  } catch (e) {
    return { svg: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export function getPreamble(): string {
  return PREAMBLE;
}
