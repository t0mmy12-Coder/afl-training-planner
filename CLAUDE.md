# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

**Serving the app** (required — `fetch()` won't work over `file://`):
- VS Code Live Server extension → right-click `index.html` → Open with Live Server
- Default URL: `http://127.0.0.1:5500`

**No build step.** No npm, no bundler, no transpilation. Edit files and refresh the browser.

**After any meaningful change:**
```
git add <files>
git commit -m "descriptive message"
git push origin master
```
GitHub repo: https://github.com/t0mmy12-Coder/afl-training-planner

## Architecture

The app is a single-page application using a hand-rolled observable store + screen router pattern.

### State flow
`store.js` holds all application state (`playerCount`, `category`, `activeScreen`, `drills`, `categories`, `plans`, `activePlanId`, `selectedDrillId`, `panelOpen`). Any module can call `setState(patch)` to update state; all subscribers are notified synchronously. There is no two-way binding — components re-render imperatively on state change.

### Screen lifecycle
`router.js` keeps one active screen at a time. `registerRoutes()` in `main.js` maps screen names to modules. Each screen module exports `mount(root, params, navigate)` which appends DOM to `root` and returns an optional `unmount` function (used to clean up `subscribe()` listeners). The router calls `unmount` before switching screens.

### Persistent UI vs screens
`navBar.js` and `planPanel.js` are mounted once in `main.js` outside the screen root and subscribe directly to the store — they are never unmounted. The plan panel is always in the DOM; CSS `transform: translateX(100%)` hides it.

### Data loading
`main.js` fetches `data/drills.json` and `data/categories.json` on startup, seeds the store, then navigates to the landing screen. If the fetch fails (e.g. opened as `file://`) a friendly error is shown instead of the app.

### SVG diagram pipeline
Each drill has a `diagram` object with `fieldType`, `players` (normalised 0–1 coords), and `arrows` (referencing player IDs). `svgHelpers.js` owns all SVG generation: `buildDiagramSVG(diagram)` scales player coords to the 400×300 viewBox, draws the field background, renders arrows with `<marker>` arrowheads, and renders players as coloured circles with role-based styling (leader = navy/gold, attacker = red, defender = white/navy, player = steel blue).

### Plan persistence
Plans are stored in `localStorage` under key `afl_training_plans`. All mutation helpers (`addDrillToPlan`, `removeDrillFromPlan`, `moveDrillInPlan`, `renamePlan`, `deletePlan`) in `planStorage.js` are pure functions that return new arrays — the caller is responsible for calling `savePlans()` then `setState({ plans })`.

### Player count filtering
Drills have `minPlayers` and `maxPlayers`. The value `24+` on the landing screen maps to `24` in the store. A drill matches if `playerCount >= minPlayers && playerCount <= maxPlayers`. `maxPlayers: 99` is the convention for "unlimited".
