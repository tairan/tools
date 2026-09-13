# Repository Guidelines

## Project Structure & Module Organization
This repository is the browser-only **泰然工具箱** at `https://tools.tairan.org/`, built with Vite multi-page mode and vanilla JavaScript. The GitHub repository is `tairan/tools` (renamed from `pdf2jpg`).

- `src/catalog.js`: tool metadata (`slug`, `title`, `description`) and URL convention
- `index.html`, `src/home.js`, `src/home.css`: Chinese tool directory, with cards rendered by Vite
- `<slug>/index.html`: independent tool HTML entry, discovered from the catalog
- `src/tools/pdf2jpg/`: existing PDF UI, conversion, ZIP, localization, and tool styles
- `src/shared/`: common CSS and existing browser preferences
- `public/`: static resources

Keep each tool's business code isolated. The home page must not import PDF.js, its worker, or ZIP libraries. Add tools only when explicitly requested; the catalog must list working tools only. Use ordinary page navigation, with unknown paths returning 404. Do not add a catch-all SPA rewrite.

Top-level configuration lives in `package.json`, `vite.config.js`, and `netlify.toml`. Local and Netlify builds use Node 22 (at least 22.13.0).

## Build, Test, and Development Commands
- `npm ci`: install locked dependencies
- `npm run dev`: start the local Vite dev server
- `npm run build`: create a production bundle in `dist/`
- `npm run preview`: serve the built app locally for a final smoke test

Run `npm run build` before opening a PR to catch bundling or import issues.

## Coding Style & Naming Conventions
Use ES modules, vanilla JavaScript, and 2-space indentation. Prefer small, single-purpose functions and keep browser-specific code explicit. Match the current naming patterns:

- `camelCase` for variables and functions like `convertPdfToJpegs`
- kebab-case for module filenames like `pdf-converter.js`
- `const` for DOM references and values that do not change

No formatter or linter is configured yet, so keep style consistent with existing files and avoid large unrelated refactors.

## Testing Guidelines
There is no automated test suite configured today. Validate changes with:

- `npm run dev` for interactive testing in the browser
- `npm run build` to verify the production bundle
- `npm run preview` for a quick post-build check

When changing conversion behavior, test both split-page ZIP export and stitched-image export with real multi-page PDFs.

## Commit & Pull Request Guidelines
Follow the existing Conventional Commit pattern from history, for example: `feat: add PDF stitch option` or `fix: handle empty file input`.

PRs should include:

- a short description of the user-facing change
- linked issue or context when applicable
- screenshots or GIFs for UI changes
- notes on manual test cases you ran

## Deployment & Configuration Notes
This project uses the existing Netlify project `tairans-tools.netlify.app` via `netlify.toml`, with `tools.tairan.org` as its production domain. DNS remains in Cloudflare, managed using `CF_TOKEN` from the environment. Never commit credentials. Do not add old-domain 301 redirects. Keep processing client-side only; do not introduce server upload flows without explicitly documenting the privacy tradeoff in `README.md`.
