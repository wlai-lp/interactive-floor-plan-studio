# Interactive Floor Plan Studio

Turn a PNG, JPG, or WebP floor plan into a semantic, interactive SVG dashboard—entirely in the browser.

## Why this project exists

Automatic bitmap tracing produces anonymous paths. Floor Plan Studio creates useful geometry: each polygon represents a named room that can be selected, styled, exported, and eventually mapped to a Home Assistant entity.

## Current MVP

- Local image upload with no server processing
- Room polygon tracing in original image coordinates
- Room selection, naming, colors, and simulated state
- Drag-to-move, eight-handle resize, and individual vertex adjustment
- Pointer-based mouse, pen, and touch editing with gesture-level undo/redo
- Device markers
- Undo and redo
- Browser-local project persistence
- Semantic SVG and editable JSON export
- Interactive playground mode
- Responsive desktop and tablet interface

## Architecture

The editor keeps one coordinate system: the uploaded image's natural width and height. SVG uses the same `viewBox`, so room geometry stays aligned at every display size. React owns semantic project data; SVG is a deterministic render of that data.

```text
Uploaded image → SVG coordinate space → Semantic project JSON
                                      ↘ SVG / playground export
```

All MVP processing runs client-side. Images are represented as data URLs in browser memory and local storage. No image or project data is sent to an application server.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Then open the local URL shown in the terminal.

## Run with Docker

Build the production image:

```bash
docker build -t interactive-floor-plan-studio .
```

Run it locally:

```bash
docker run --rm -p 3000:3000 --name floor-plan-studio interactive-floor-plan-studio
```

Open [http://localhost:3000](http://localhost:3000).

For a detached deployment that restarts automatically:

```bash
docker run -d \
  --restart unless-stopped \
  -p 3000:3000 \
  --name floor-plan-studio \
  interactive-floor-plan-studio
```

The image uses a multi-stage Node.js 22 build, runs as the unprivileged `node` user, and includes a health check. The app stores projects in each visitor's browser, so no persistent Docker volume is required.

## Validation

```bash
npm run lint
npm run build
```

## Versions and Conventional Commits

Pull-request titles must use Conventional Commits, for example `feat: add room groups` or `fix(editor): preserve device position`. When a PR is merged into `main`, GitHub Actions advances the version, updates `package.json` and `package-lock.json`, creates a matching `vX.Y.Z` tag and GitHub release, and commits the version metadata back to `main`.

- `feat` increments the minor version.
- A breaking `!` increments the major version.
- All other accepted types (`fix`, `perf`, `docs`, `refactor`, `test`, `build`, `ci`, `chore`, `style`, and `revert`) increment the patch version.

The sidebar reads the package version in production. Local development displays `v0.0.0-dev`. Docker can override the displayed build version with `docker build --build-arg APP_VERSION=1.2.3 ...`.

## Agent workflow

Project agents follow the shared workflow in [`docs/development/agent-workflow.md`](docs/development/agent-workflow.md). Role-specific operating instructions live in [`.github/agents/`](.github/agents/). GitHub Issues and the GitHub Project remain the authoritative work queue and handoff mechanism.

## Roadmap

- Edge insertion and vertex deletion
- Pan and zoom
- HTML playground bundle export
- Home Assistant entity mapping
- OpenCV.js wall and closed-region suggestions in a Web Worker
- Optional AI-assisted semantic proposals

## Privacy and security

Do not place API keys in client code. Future AI analysis should use an optional server endpoint so provider credentials remain secret. AI output should return structured geometry for user review, never become the unvalidated source of truth.

## License

MIT
