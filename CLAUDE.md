# CLAUDE.md

## Dev
- Vanilla JS SPA — no build step, no npm, no bundler.
- Serve via Live Server (`http://127.0.0.1:5500`). `fetch()` fails over `file://`.
- After changes: `git add <files> && git commit -m "msg" && git push origin master`
- Repo: https://github.com/t0mmy12-Coder/afl-training-planner

## Architecture
Observable store + screen router pattern.

**State (`store.js`):** `setState(patch)` notifies all subscribers synchronously. Keys: `playerCount`, `category`, `activeScreen`, `drills`, `baseDrills`, `categories`, `plans`, `activePlanId`, `selectedDrillId`, `panelOpen`. `drills` = merged (base + custom); `baseDrills` = raw from JSON, never mutated.

**Routing (`router.js`):** One active screen at a time. Screens registered in `main.js`. Each screen exports `mount(root, params, navigate)` → returns `unmount()` to clean up `subscribe()` listeners. Routes: `landing`, `categories`, `drills`, `drillEditor`.

**Persistent UI:** `navBar.js` + `planPanel.js` mounted once in `main.js`, never unmounted. Plan panel hidden via `transform: translateX(100%)`.

**Startup (`main.js`):** Fetches `data/drills.json` + `data/categories.json`, merges with `loadCustomDrills()`, seeds store, navigates to landing.

## Screens & components
- `js/screens/` — landing, categories, drillBrowser, drillEditor
- `js/components/` — navBar, planPanel, drillCard, drillDiagram, diagramEditor
- `js/utils/` — svgHelpers, planStorage, drillStorage

## Drill data & custom drills (`drillStorage.js`)
- Base drills loaded from `data/drills.json` (immutable).
- Custom drills persisted in `localStorage` key `afl_custom_drills`; deleted drill IDs in `afl_deleted_drills`.
- `mergeWithBase(baseDrills, customDrills)` produces the merged `drills` array (custom overrides same-id base; deleted filtered out).
- After any save/delete in the editor, call `rebuildStore()` to re-merge and `setState({ drills })`.

## SVG diagrams (`svgHelpers.js`)
- `buildDiagramSVG(diagram)` is the sole read-only SVG entry point. Viewbox 400×300.
- `diagram.players` — normalised 0–1 coords, roles: leader/attacker/defender/player.
- `diagram.arrows` — two formats: player-ref `{from, to, type}` OR free-form `{x1,y1,x2,y2,type}`. `renderArrow` handles both.
- `diagram.customTypes` — `[{id, label, color, dash}]`; `arrowDefs(customTypes)` injects their SVG markers.
- Standard arrow types: `run` (green/solid), `kick` (gold/dashed), `handball` (orange/dotted).

## Diagram editor (`diagramEditor.js`)
- Interactive SVG editor returned by `createDiagramEditor(diagram, onChange)`.
- **Z-order fix:** bg `<rect>` is first in SVG (lowest); `fieldBackground()` wrapped in `<g pointer-events="none">`; players/arrows on top.
- Tools: select/move, addPlayer (role picker), addArrow (type picker + inline custom type form), delete.
- Arrows are stored as free-form coords in the editor. Player-ref arrows from JSON are converted via `toFreeForm()` on load.
- Drag: players drag freely; arrow body drag moves both endpoints; endpoint handles move individually.

## Plan persistence (`planStorage.js`)
- Plans in `localStorage` key `afl_training_plans`.
- Helpers are pure (return new arrays). Caller calls `savePlans()` then `setState({ plans })`.

## Player count filtering
- `24+` on landing maps to `24` in store. Match: `playerCount >= minPlayers && playerCount <= maxPlayers`. `maxPlayers: 99` = unlimited.
