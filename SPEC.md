# Beachside Canvas — Zoom & Collapse Testbed

**Spec status:** reflects the final implemented logic as of this document. This is a vanilla HTML/CSS/JS prototype (no build step, no dependencies) — open `index.html` directly in a browser.

## 1. Purpose

An interactive testbed for an infinite-canvas editor's responsive chrome and camera (zoom/pan) system. It exists to let the team tune and compare, live and side by side:

- How a scene's default zoom is computed (two competing fit rules, three padding strategies, plus an alternative "full-fit × 75%" rule).
- How the left layer list and floating task bar collapse/expand at different viewport widths, and whether collapsing pushes canvas content or just overlays on top of it.
- How direct manipulation (scroll-to-zoom, click-and-drag pan) composes with the auto-fit system.

All of the above is adjustable live via the always-visible **Debug HUD**, without touching code.

## 2. Layout & Components

Six chrome regions surround a central canvas viewport. All measurements below are the shipped defaults (px, at 100% task-bar/layer-list "layout" scale — see §4 for what "layout" vs "visual" width means).

| Component | Element | Width/Height | Notes |
|---|---|---|---|
| Top bar | `#topbar` | full width × 56px | Fixed. Logo + breadcrumb text. |
| Left layer list | `#layerlist` | 88px collapsed / 328px expanded | Fixed to the left edge, full height below the top bar. "+" button doubles as the expand/collapse toggle (see §5). |
| Task bar | `#taskbar` | 64px collapsed / 230px expanded | Floating panel, 16px right of the layer list, ~120px from the top. Breakpoint-driven with hover-to-expand (see §5). |
| Canvas viewport | `#canvas` | fills the remaining width, full height below the top bar | Clips (`overflow:hidden`) the scaled world layer. This is the zoomable/pannable region. |
| Right rail | `#right-rail` | 40px × full height | Fixed to the right edge. Always-on-top chrome (highest z-index in the app). |
| Generation panel | `#gen-panel` | 360×575px, fixed | Docked 16px off the scene's on-screen right edge, top-aligned with it. Tracks the scene as it pans/zooms but never itself scales. Always open (no open/close toggle). |
| Bottom toolbar | `#bottom-toolbar` | auto, floating pill | Bottom-center. Cosmetic tool icons + live zoom-percent readout. |

### Canvas world content

Inside `#canvas`, `#canvas-content` is the scaled "world" layer — everything that pans/zooms together via one CSS `transform: translate(...) scale(...)`:

- `#grid-layer` — the dot-grid background, a large (40,000×40,000 world-unit) tile so it never runs out at any pan/zoom extreme.
- `#scene-frame` — the scene's background fill (2048×2048 world units by default; see §3 for other presets). This is the only element whose fill genuinely scales with zoom.

Everything else that visually belongs to "the scene" — its outer border, header (title + close), and inner content border — is **not** inside `#canvas-content`. They're separate elements (`#scene-border`, `#scene-chrome`, `#scene-inner`) repositioned/resized every frame to match the scene's live on-screen box, but never scaled themselves. This keeps strokes, text, and icons a crisp, constant screen size at any zoom level instead of thinning to invisibility or blowing up.

## 3. Scene presets

| Preset | Size (world units) |
|---|---|
| 2048×2048 (default) | square |
| 2368×1728 | landscape |
| 1536×2688 | portrait |
| 1024×1024 (small) | square, half-linear-size of the default |

Fit zoom is computed against a **fixed reference size** (`REFERENCE_SIZE = 2048×2048`), not each preset's own dimensions. This means switching presets is *true to size*: the 1024 preset always renders at exactly half the linear size of the 2048 preset at the same zoom, rather than each preset independently stretching to fill the same on-screen footprint (which is what a naive "fit to container" computation would do).

## 4. Camera system (zoom & pan)

### Coordinate model

- **World space**: raw, unscaled units. The scene sits at world origin (0, 0). `#canvas-content`'s transform (`translate(panX, panY) scale(zoom)`) is the single "camera" — one transform moves the grid and scene together.
- **Screen space (canvas-local)**: pixels relative to `#canvas`'s own top-left corner (which is itself offset 56px — `TOPBAR_H` — below the stage). `panX`/`panY` are expressed in this space. All the "chrome that tracks the scene but doesn't scale" elements (`#scene-border`, `#scene-chrome`, `#scene-inner`, `#gen-panel`) are positioned in this same screen space, computed from the scene's current `panX/panY/sceneWidthPx/sceneHeightPx` every `recompute()`.

### Two zoom sources, one result

Every `recompute()` resolves to one `zoom` (0.05–4.0) and one `(panX, panY)`, in this priority order:

1. **Manual override** (`state.zoomMode === 'manual'`) — `zoom = state.manualZoom / 100`, pan read directly from `state.manualPanX/Y`. Entered automatically by:
   - Dragging the **Manual zoom** HUD slider (5–400%).
   - **Scroll/wheel over the canvas** (`js/canvas-zoom.js`) — zooms anchored at the cursor (the world point under the cursor stays visually fixed). Speed factor `exp(-deltaY × 0.0015)`, clamped 5–400%.
   - **Click-and-drag on the canvas** (`js/canvas-pan.js`) — 1:1 pan, tracked via `mousedown`/`mousemove`/`mouseup` on `window` so a drag that leaves the canvas bounds still ends cleanly. Cursor shows `grab`/`grabbing`.
2. **Auto-fit** (`state.zoomMode === 'auto'`, default) — computed fresh every frame from one of two rule sets (below). While auto, `state.manualZoom`/`manualPanX`/`manualPanY` are kept continuously synced to the live auto view, so the *first* wheel-zoom or drag starts from wherever the view currently sits rather than jumping.

Switching back to **auto (fit)** in the HUD resumes the fit engine; nothing is lost, since manual state was always being synced in the background.

### Auto-fit rule sets

Only one is active at a time, toggled by the **"alt scaling rule"** checkbox (top of the HUD):

**A. Fit rule + Padding mode (default, alt scaling rule OFF)**

- **Fit rule** — radio: **A (vertical only)** fits `REFERENCE_SIZE.h` to available height only; **B (min-fit, default)** takes `min(zoomV, zoomH)` so nothing is cropped on either axis.
- **Padding mode** — radio, computes `padH`/`padV` subtracted from the available area before the fit ratio:
  - *percentage* — `marginPct% × available axis` (slider 0–25%, default 10%).
  - *fixed px* — flat `fixedPad` on both axes (slider 0–200px, default 64px).
  - *hybrid clamp* — `clamp(padMin, marginPct% × available axis, padMax)` (padMin 0–150px default 48, padMax 0–300px default 160). This is the default mode — proportional in the middle, with a floor/ceiling at the extremes.
- Result clamped to `[5%, maxZoomCap]`.

**B. Alt scaling rule (alt scaling rule ON) — the agreed-upon decision**

> On: full-fit × 75%, capped by Max zoom cap below (100), floored at 20% (overrides Fit rule + Padding mode). Off: removes this rule, reverting to Fit rule + Padding mode.

Concretely:
1. `fitW = availableWidth / scene.w`, `fitH = availableHeight / scene.h` — **against the active preset's own size**, not `REFERENCE_SIZE` (unlike rule A above, this does re-normalize per preset).
2. `zoom = min(fitW, fitH) × 0.75` — backs off the full-bleed fit to leave breathing room on all sides.
3. Clamp: never below **20%** (the generation panel is always open, so this floor always applies — see below), never above **Max zoom cap** (default 100%, slider 25–100%).

When the 20% floor pushes the scene wider than the panel-reserved available width, the existing centering formula (`panX = localX0 + (availableWidth - sceneWidthPx) / 2`) naturally goes negative relative to `localX0` — the view shifts left on its own, no special-cased panning needed. This is intentional: don't shrink past legibility, just accept the scene extending under the left chrome (and behind it, via z-index — see §6) rather than the panel becoming unreadable.

Turning the alt rule on visually disables (dims, `pointer-events:none`) the Fit rule and Padding mode HUD sections, since they no longer affect anything while it's active.

### Max zoom cap

Independent of which rule is active: fit zoom is clamped to never exceed this cap (default 100%, slider 25–100%). Prevents a small scene on a large viewport from being blown up past its own actual size (blurriness). The bottom-toolbar zoom readout shows a ⚠ and turns amber when the cap is actively clipping the computed fit.

## 5. Responsive collapse behavior — the decisions

### Left layer list — **no auto-collapse**

Purely a manual toggle. `state.layerListExpanded` (default `true`, i.e. **expanded by default**) flips only when the **"+" button** (`#layerlist-toggle`) is clicked — no breakpoint, no HUD control. There is no "auto" mode for this element at all.

Expanding/collapsing **never pushes canvas content**: the available-area calculation always assumes the layer list's *collapsed* footprint (`LAYERLIST_W_COLLAPSED`), regardless of its actual state. The scene, its zoom, and the generation panel are unaffected by this toggle — verified byte-identical before/after. The layer list's own box still visually grows to 328px when expanded; since its z-index (40) is well above the canvas world content, it simply overlays on top of the canvas underneath rather than the canvas moving out of its way. The task bar still repositions to track the layer list's *real* width (so it never overlaps the layer list itself), which is the one piece of chrome that *does* still shift — but that's chrome repositioning itself, not canvas content being pushed.

### Task bar — **auto-collapse under 1480px, hover-to-expand, no push**

- `state.taskbarBreakpoint` (slider, 100–1920px, **default 1480px**): below this viewport width the bar auto-collapses to the 64px icon-only rail; at or above it, it's expanded (230px, icon + label rows).
- **Hover-to-expand**: while collapsed, `mouseenter`/`mouseleave` on `#taskbar` (`js/taskbar-hover.js`) temporarily shows the expanded layout; leaving collapses it back.
- **Hover-to-expand behavior** (radio, **default: overlay / no push**):
  - *overlay (no shift, default)* — the layout math keeps treating the bar as collapsed while hover-expanded. The bar's own box still grows (left edge fixed, grows rightward), floating on top of the canvas underneath — nothing else moves, matching the layer list's own overlay behavior.
  - *push content* — the layout math uses the bar's real expanded width, so the scene and generation panel shift right to make room, same as a force-expanded/auto-wide bar always did.

## 6. Stacking order (z-index)

Two tiers, low to high:

**Canvas world tier** (inside `#canvas-content`, which establishes its own stacking context via `transform`):
- `#grid-layer` (implicit, 0)
- `#scene-frame` — 10

**Screen-space / chrome tier** (siblings of `#canvas-content`, or outside `#canvas` entirely):
- `.ruler-top` / `.ruler-left` — 5
- `#avail-outline` (debug overlay) — 6
- `#scene-border` / `#scene-inner` — 11
- `#scene-chrome` — 12
- `#gen-panel` — 13
- `#bottom-toolbar` — 35
- `#layerlist` — 40
- `#taskbar` — 45
- `#right-rail`, `#topbar` — 50 (highest normal-flow chrome — "always on top," can never be covered by canvas content panned/zoomed underneath it)
- `#hud` — 1000, `#hud-collapsed-btn` — 1001 (debug overlay, always frontmost)

Because the whole canvas-world tier sits at effectively z-index 0 in the outer context, *any* chrome element with a positive z-index (layer list, task bar, right rail) automatically renders above it — panning/zooming the canvas can never cover fixed chrome, only the reverse.

## 7. Debug HUD reference

Top to bottom:

1. **Alt scaling rule** — checkbox; see §4. Dims Fit rule + Padding mode when on.
2. **Fit rule** — A/B radio (§4), *show available-area outline* checkbox (visualizes the fit target region), *animate transitions* checkbox (global — toggles CSS transitions on/off across every animated element for instant vs. eased changes).
3. **Padding mode** — percentage / fixed px / hybrid clamp radio + the relevant sliders (§4).
4. **Max zoom cap** — slider, 25–100%, default 100.
5. **Zoom control** — auto (fit) / manual radio, **Manual zoom** slider (5–400%, default 100). Hint notes wheel-zoom and drag-pan both switch this to manual.
6. **Task bar trigger width** — slider, 100–1920px, default **1480**. **Hover-to-expand behavior** — push/overlay radio, default **overlay**.
7. **Scene size preset** — radio, §3.
8. **Simulated viewport size** — buttons: Real window / 1280w / 1440w / 1680w / 1200×700 floor. Letterboxes `#stage` to a fixed size (or fixed width, full height) to test breakpoints without resizing the actual browser window.
9. **Summary readouts** — Viewport (W×H), Available area (W×H), Pad H/V (px, or "n/a (alt rule)" when the alt rule is active).

## 8. File structure

```
index.html                 — markup shell + <link>/<script> references only
css/
  base.css                 — theme variables, page/stage shell
  topbar.css
  layerlist.css
  taskbar.css
  canvas.css                — viewport, grid, rulers, available-area outline
  scene.css                 — scene frame + its screen-space chrome
  rail-panel.css            — right rail + generation panel
  toolbar.css                — bottom floating toolbar
  hud.css                     — debug HUD
js/
  constants.js               — layout numbers, scene presets, task bar item list
  state.js                    — the single state object + clamp() helper
  dom.js                      — cached element references
  build-static.js            — builds task bar rows + layer list rows
  rulers.js                   — ruler tick rendering
  layout-engine.js          — recompute(): the core camera/fit logic (§4)
  taskbar-hover.js           — hover-to-expand mouse listeners
  canvas-zoom.js              — cursor-anchored wheel zoom
  canvas-pan.js               — click-and-drag pan
  simulate.js                  — simulated-viewport HUD buttons
  hud.js                       — wires all other HUD controls to state
  main.js                      — ResizeObserver + initial recompute() call
icons/                        — SVG icons matched to task bar items by filename
```

Scripts are loaded as plain (non-module) `<script src>` tags, not ES modules — `type="module"` is blocked by CORS when the page is opened directly as `file://` with no server, which would break double-click usage. Plain scripts sharing one global scope means load order matters: constants → state → dom → build-static → rulers → layout-engine → taskbar-hover → canvas-zoom → canvas-pan → simulate → hud → main.

## 9. Interaction summary

| Gesture | Effect | Switches to manual? |
|---|---|---|
| Scroll/wheel over canvas | Zoom, anchored at cursor | Yes |
| Click-and-drag on canvas | Pan | Yes |
| Click "+" in left layer list | Toggle layer list expand/collapse (never affects canvas) | No |
| Hover collapsed task bar | Temporarily expand it (overlay by default, or push per HUD setting) | No |
| Mouse leave expanded (hover-triggered) task bar | Collapse it back | No |
| Drag Manual zoom slider | Set zoom directly, pan unchanged | Yes |
| Switch Zoom control to "auto (fit)" | Resume the fit engine | — (returns to auto) |
