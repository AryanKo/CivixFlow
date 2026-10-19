# CivixFlow

A local-first traffic command-center frontend with animated cars, adaptive signals and simulation analytics. The actual Arduino/mobile-hotspot backend lives in a separate repository and is **not included**. [INTEGRATION_HANDOFF.md](INTEGRATION_HANDOFF.md) documents the merge points for its owner or integration agent.

## Run locally

Choose either route; the frontend assets are already built and require no internet at runtime.

**Windows / Python:** install Python 3.9+, then double-click `start.bat`. It opens [http://127.0.0.1:8000](http://127.0.0.1:8000). No pip packages are required. Keep the terminal open; Ctrl+C stops it. Use `.\start.ps1 -Port 8001` if port 8000 is occupied.

**Node.js 22+:** run `npm start`, then open the same URL. No npm install is required to preview because the server uses Node's built-in libraries. Alternative port: `npm start -- --port 8001`.

**macOS/Linux / Python:** run `sh start.sh` or `python3 run.py`. The Unix launcher is provided but was not tested on those platforms.

The existing `run_server.bat` and `run_dashboard.ps1` entry points launch the same preview. Do not open index.html directly: ES modules need an HTTP server.

## Simulation behavior

- Fixed 60 Hz physics and interpolated rendering keep acceleration and signal timing consistent at different display refresh rates. 1x/2x/5x playback advances all simulation components on the same clock.
- Road artwork and ordinary vehicle sprites are cached. Canvas rendering respects device pixel ratio, resizes with its container, and avoids large catch-up jumps after switching browser tabs.
- Vehicles queue at red lights, follow the vehicle ahead, turn and exit. Emergency vehicles obey the preempted signal instead of ignoring all red lights.
- Presets, pause/resume, fixed/adaptive mode and manual overrides remain simulation-only. Narrow screens wrap controls instead of overflowing.
- Styles, Chart.js and Lucide are bundled locally; no CDN or Google Fonts requests are needed.
- The default controller is the existing max-pressure/gap-out heuristic, **not a trained ML model**. Congestion, safety and CO2 widgets are simulation estimates. The fixed baseline is an approximate queue model, not validated evidence of real-world ML improvement. Historical technical/pitch documentation remains in docs/ORIGINAL_README.md and docs/HACKATHON_PITCH.md.

The collapsed optional backend panel is disabled by default. A normal preview makes **no API or WebSocket requests**. Its proposed adapter must be matched to the real backend before enabling; connection defaults do not claim compatibility with any Arduino firmware. Simulated cars and measured hardware readings must remain separate.

## Develop and verify

```sh
npm ci
npm test
npm run build
```

Node.js 22+ is needed for rebuilding CSS or changing dependencies. The lockfile pins the development toolchain. Tests cover simulation time at 30/60/144 Hz, pause/resume, red-light compliance, finite vehicle motion across all presets, actual adaptive phase switches and public-file serving boundaries. GitHub Actions runs tests and the asset build on pull requests and main.

Bundled library licenses are in assets/vendor/; see THIRD_PARTY_NOTICES.md. At build time npm audit reported seven advisories in Tailwind 3's transitive build tooling (five high, two moderate). Compatible fixes did not resolve them; the suggested Tailwind 4 upgrade changes the build system. These build dependencies are absent from the ZIP and are not served by the preview. Build trusted source only.

## Package and deploy

```sh
python scripts/package.py
```

release/CivixFlow-Frontend.zip contains the runnable frontend, prebuilt assets, launchers, tests and handoff. It excludes node_modules, Git internals and any backend implementation.

The original root layout (index.html, js/, assets/) is preserved. Vercel remains a static site at the repository root and runs npm run build; it does not supply the future Arduino backend. Unversioned asset responses revalidate after updates.

Developed by [Aryan](https://github.com/AryanKo). Original technical documentation and pitch: [docs/](docs/).
