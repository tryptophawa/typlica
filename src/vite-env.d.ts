/// <reference types="vite/client" />

declare module '*.typ?raw' {
  const content: string;
  export default content;
}

interface TypstCompiler {
  setCompilerInitOptions(opts: { getModule: () => string }): void;
  setRendererInitOptions(opts: { getModule: () => string }): void;
  svg(opts: { mainContent: string }): Promise<string>;
}

declare var $typst: TypstCompiler;
