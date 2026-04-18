# Typlica

An interactive Typst exercise platform — bringing a [Rustlings](https://github.com/rust-lang/rustlings)-style learning experience to the [Typst](https://typst.app/) world.

[中文文档](README-zh_cn.md)

## Features

- **Pure frontend**: deployable on any static hosting service (e.g. GitHub Pages)
- **In-browser compilation**: compiles Typst code directly in the browser via [typst.ts](https://github.com/Myriad-Dreamin/typst.ts)
- **Live preview**: instant output as you type
- **Diff checking**: built-in pixel-level diff that highlights differences from the reference answer
- **Syntax highlighting & completion**: Typst syntax highlighting and keyword completion powered by CodeMirror 6
- **Progress saving**: code and completion state are automatically saved to localStorage
- **Mobile-friendly**: editor always visible; preview panels switch between Current / Expected / Diff tabs
- **Bilingual UI**: switch between English and Chinese at any time

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output is placed in the `dist/` directory.

## Adding Exercises

1. Create a new directory under `exercises/`, e.g. `exercises/06-tables/`
2. Add an `answer.typ` file (the reference solution)
3. Add a `template.typ` file (the starting template shown to users)
4. Register the exercise metadata in `src/exercises.ts`

## Project Structure

```
typlica/
├── .github/workflows/deploy.yml   # GitHub Pages deployment
├── exercises/                      # Exercise files
│   ├── preamble.typ               # Shared preamble
│   ├── 01-hello-world/
│   │   ├── answer.typ
│   │   └── template.typ
│   ├── 02-text-styling/
│   ├── 03-headings/
│   ├── 04-lists/
│   └── 05-math/
├── src/
│   ├── main.ts                    # App entry point
│   ├── compiler.ts                # typst.ts rendering wrapper
│   ├── editor.ts                  # CodeMirror editor setup
│   ├── exercises.ts               # Exercise data & progress management
│   ├── diff.ts                    # Pixel-level image diff
│   ├── i18n.ts                    # Internationalization (zh-CN / en)
│   ├── typst-lang.ts             # Typst syntax highlighting
│   └── style.css                  # Styles
└── index.html
```

## Tech Stack

- [Vite](https://vitejs.dev/) — build tool
- [typst.ts](https://github.com/Myriad-Dreamin/typst.ts) — in-browser Typst compiler
- [CodeMirror 6](https://codemirror.net/) — code editor (mobile-friendly)

## License

MIT
