// The core "camera" logic: given the current state (rule, padding mode,
// zoom mode, scene preset, panel/task-bar state) and the live stage size,
// computes the available area, the fit zoom, and pans/scales #canvas-content
// as a single transform so the scene, grid, and any future canvas objects
// move together. Chrome (bars/panels) is positioned separately, in screen space.

function recompute(){
  const rect = stage.getBoundingClientRect();
  const vw = rect.width, vh = rect.height;
  // #canvas is offset TOPBAR_H down from the stage but spans the full
  // width, so its own local coordinate origin (0,0) = stage's (0, TOPBAR_H).
  const canvasW = vw;
  const canvasH = Math.max(0, vh - TOPBAR_H);

  // left layer bar state: a continuously drag-resizable width (drag
  // #layerlist-resize-handle on its right edge — js/layerlist-resize.js),
  // clamped between the collapsed and expanded extremes; the "+" button
  // (js/hud.js) just snaps it to whichever extreme it isn't at. Only the
  // exact collapsed extreme switches to the icon-only CSS layout
  // (.collapsed, centered thumbnails/no labels) — anything wider uses the
  // normal label layout, truncating via ellipsis as it narrows.
  //
  // Until the user has manually set a width (drag or the toggle button —
  // state.layerListWidthManuallySet), it instead tracks this recompute's
  // own vw live: collapsed below LAYERLIST_COLLAPSE_VW, expanded at/above.
  // This reads the same vw every other breakpoint in this function uses
  // (the stage's real size, which js/simulate.js's HUD buttons resize
  // directly) rather than window.innerWidth, so switching "Simulated
  // viewport size" presets collapses/expands it too, not just actually
  // resizing the browser window.
  if(!state.layerListWidthManuallySet){
    state.layerListWidth = vw < LAYERLIST_COLLAPSE_VW ? LAYERLIST_W_COLLAPSED : LAYERLIST_W_EXPANDED;
  }
  const layerListW = clamp(LAYERLIST_W_COLLAPSED, state.layerListWidth, LAYERLIST_W_EXPANDED);
  layerlistEl.classList.toggle('collapsed', layerListW <= LAYERLIST_W_COLLAPSED);
  layerlistEl.style.width = layerListW + 'px';

  // layerListW above is the panel's real, live width — always used for its
  // own box and for taskbar.style.left below, so the task bar visually
  // slides along with it, staying adjacent with no gap or overlap. But
  // while actively drag-resizing (js/layerlist-resize.js), canvas-affecting
  // math uses this frozen reservation instead, held at whatever the width
  // was when the drag started — so the panel (and the task bar riding along
  // with it) grow/shrink as a floating overlay *on top of* the canvas
  // without reflowing the scene/generation panel underneath, mid-drag. The
  // freeze lifts (and the canvas reflows to fit the settled width) the
  // instant the drag ends, same as the zoom freeze below.
  const layerListReserveW = layerListDragging ? layerListDragStartWidth : layerListW;

  // breakpoint / task bar state. "collapsed" is the natural breakpoint
  // state; hovering a collapsed bar shows it expanded (visualCollapsed)
  // without necessarily changing the *layout* footprint other chrome reacts
  // to — that's what taskbarExpandMode (push vs overlay) controls below.
  // Above TASKBAR_STATIC_VW the bar is pinned expanded and the collapsing
  // interaction is disabled outright — neither the breakpoint slider nor a
  // just-made sub-menu selection (taskbarForceCollapsed) can collapse it.
  const TASKBAR_STATIC_VW = 1500;
  const collapsed = vw <= TASKBAR_STATIC_VW && (vw < state.taskbarBreakpoint || state.taskbarForceCollapsed);

  const hoverExpanded = collapsed && state.taskbarHovered;
  const visualCollapsed = collapsed && !hoverExpanded;
  taskbar.classList.toggle('collapsed', visualCollapsed);

  const taskbarVisualW = visualCollapsed ? TASKBAR_W_COLLAPSED : TASKBAR_W_EXPANDED;
  // Overlay mode: while hover-expanded, keep the layout math as if the bar
  // were still collapsed — the bar's own width still grows via CSS (left
  // edge is fixed, so it just grows rightward over the canvas), but nothing
  // else shifts to make room for it. Push mode (default): layout always
  // uses the bar's real visual width, so expanding it shoves the scene and
  // panel right, same as force-expanded/auto-wide behavior already did.
  const taskbarLayoutW = (hoverExpanded && state.taskbarExpandMode==='overlay')
    ? TASKBAR_W_COLLAPSED
    : taskbarVisualW;

  taskbar.style.left = (layerListW + TASKBAR_OFFSET) + 'px';
  taskbar.style.transition = state.animate ? 'width .2s ease, left .2s ease' : 'none';

  // Generation panel is always open, so the available area always reserves
  // room for it — its own width, the gap between the scene and its left
  // edge, and an inset — plus the right rail (#right-rail, RAIL_W wide),
  // which is fixed chrome pinned to the viewport's right edge at a higher
  // z-index than the panel. Without reserving RAIL_W too, the panel's own
  // inset (24px) was smaller than the rail's width (40px), so the panel's
  // rightmost sliver rendered *underneath* the rail — near-identical dark
  // colors made that read as the panel simply being clipped.
  const GEN_PANEL_GAP = 16;
  const rightSpace = GEN_PANEL_GAP + PANEL_W + PANEL_INSET + RAIL_W;

  // available area, expressed in #canvas-local coordinates (top-left of
  // #canvas is already below the top bar, so no TOPBAR_H offset here).
  // Canvas layout tracks the layer bar's *real*, continuously-resizable
  // width (state.layerListWidth) via layerListW — so resizing it actually
  // reserves/frees that space, and the fit/zoom + pan recompute live as it's
  // dragged: narrower gives the scene more room (zooms in further), wider
  // gives it less (zooms out to keep clearing it). TASKBAR_GAP is
  // reserved here too (not just as a later pan clamp) so the zoom itself
  // — not just the pan — accounts for it; otherwise a snug-fit scene could
  // get pushed right by that clamp with nowhere to absorb it, overflowing
  // the generation panel off the right edge at tight widths.
  const TASKBAR_GAP = 16;
  const localX0 = layerListReserveW + TASKBAR_OFFSET + taskbarLayoutW + TASKBAR_GAP;
  const localX1 = vw - rightSpace;
  const availableWidth = Math.max(0, localX1 - localX0);

  const localY0 = 0;
  const localY1 = canvasH - BOTTOM_CLEARANCE;
  const availableHeight = Math.max(0, localY1 - localY0);

  const scene = SCENE_PRESETS[state.scenePreset];

  let padH, padV, zoom;

  if(state.altZoomRule){
    // Alt scaling rule — replaces Fit rule + Padding mode entirely while on:
    //   1) full-fit ratio against the active scene's own size (unlike the
    //      REFERENCE_SIZE-based rule below, this re-normalizes per preset)
    //   2) back off from that fit to leave breathing room on all sides —
    //      75% normally, but narrow screens have little space to spare for
    //      margin in the first place, so below BREATHING_ROOM_VW the rule
    //      backs off less (90%), sitting closer to full-fit.
    //   3) clamp: never exceed Max zoom cap; if the breathing-room zoom
    //      can't clear 15%, drop the breathing room entirely and fill
    //      edge-to-edge (trueFit) instead of aiming for a fixed 15% —
    //      trueFit is guaranteed to fit within the reserved space
    //      (availableWidth/rightSpace), a fixed 15% target isn't (it can be
    //      MORE than trueFit at small scene sizes, or leave an
    //      inconsistent, arbitrary sliver of unused breathing room at
    //      others) — so "fill everything available" is the one behavior
    //      that's consistent across every scene preset whenever breathing
    //      room genuinely isn't affordable.
    padH = padV = 0;
    const fitW = availableWidth / scene.w;
    const fitH = availableHeight / scene.h;
    const trueFit = Math.min(fitW, fitH);

    const BREATHING_ROOM_VW = 1480;
    const breathingRoom = vw < BREATHING_ROOM_VW ? 0.9 : 0.75;
    zoom = trueFit * breathingRoom;

    const PANEL_FLOOR = 0.15;
    if(zoom < PANEL_FLOOR){
      zoom = trueFit;
    }

    zoom = clamp(0.05, zoom, state.maxZoomCap/100);
  } else {
    if(state.paddingMode==='percentage'){
      padH = state.marginPct/100 * availableWidth;
      padV = state.marginPct/100 * availableHeight;
    } else if(state.paddingMode==='fixed'){
      padH = state.fixedPad;
      padV = state.fixedPad;
    } else {
      padH = clamp(state.padMin, state.marginPct/100*availableWidth, state.padMax);
      padV = clamp(state.padMin, state.marginPct/100*availableHeight, state.padMax);
    }

    // Fit against REFERENCE_SIZE (not the active scene's own w/h) so that
    // changing the scene-size preset doesn't re-normalize zoom to fill the
    // same footprint every time — see REFERENCE_SIZE for why.
    const zoomV = (availableHeight - 2*padV) / REFERENCE_SIZE.h;
    if(state.rule==='A'){
      zoom = zoomV;
    } else {
      const zoomH = (availableWidth - 2*padH) / REFERENCE_SIZE.w;
      zoom = Math.min(zoomV, zoomH);
    }

    zoom = clamp(0.05, zoom, state.maxZoomCap/100);
  }

  // While the layer list is being drag-resized (js/layerlist-resize.js),
  // hold zoom at whatever it was the moment the drag started — resizing
  // should only shift how much room the scene has to re-pan into, not
  // rescale it out from under the cursor. The freeze lifts (and zoom
  // re-fits normally) the instant the drag ends.
  if(layerListDragging && layerListDragFrozenZoom !== null){
    zoom = layerListDragFrozenZoom;
  }

  if(state.zoomMode==='manual'){
    zoom = clamp(0.05, state.manualZoom/100, 4);
    // wheel-zoom (js/canvas-zoom.js) changes state.manualZoom directly
    // without touching the slider element, so keep it (and its label) in
    // sync here too — otherwise it'd show a stale value after scrolling.
    document.getElementById('manualZoom').value = state.manualZoom;
    document.getElementById('v-manualZoom').textContent = state.manualZoom;
  } else {
    // keep state.manualZoom (and the slider) synced to the live fit zoom so
    // switching to manual — via the slider, or the first canvas wheel-zoom —
    // starts from wherever auto-fit currently sits, not a jarring jump.
    const pct = Math.round(zoom*100);
    state.manualZoom = pct;
    document.getElementById('manualZoom').value = pct;
    document.getElementById('v-manualZoom').textContent = pct;
  }

  // Exact zoom for this frame, unrounded — state.manualZoom is a rounded
  // display percentage (e.g. 24, not 23.81), so js/layerlist-resize.js reads
  // this instead when capturing the value to freeze during a drag; using
  // the rounded one there introduced a several-px positioning drift.
  state.currentZoom = zoom;

  const sceneWpx = scene.w * zoom;
  const sceneHpx = scene.h * zoom;

  // Scene sits at world-origin (0,0) inside canvas-content, at its raw
  // (unscaled) size. In auto mode the pan translate is computed to center
  // it — this is the "camera" zoom: one transform on the whole world layer
  // (grid + scene + gen panel) moves everything together, not a per-object
  // resize. In manual mode (dragging the slider, or wheel-zooming the
  // canvas via js/canvas-zoom.js) the pan is instead whatever the user left
  // it at, read straight from state; auto mode keeps that in sync with the
  // live centered position so the handoff between the two is seamless.
  let panX, panY;
  if(state.zoomMode==='manual'){
    panX = state.manualPanX;
    panY = state.manualPanY;
  } else {
    panX = localX0 + (availableWidth - sceneWpx)/2;
    panY = localY0 + (availableHeight - sceneHpx)/2;

    // Keep a minimum gap between the scene and the task bar's *natural*
    // (non-hover) footprint on the auto-fit view. localX0 already reserves
    // this gap against taskbarLayoutW, which matches taskbarNaturalW except
    // during hover-overlay (taskbarLayoutW frozen smaller so the expanded
    // bar can visually cover the scene without shoving it over) — this
    // clamp only still does work in that case, catching what localX0
    // couldn't know about. It deliberately ignores taskbarHovered, and uses
    // layerListReserveW (not the live layerListW) so it doesn't fight the
    // same drag-overlay freeze localX0 uses — otherwise this clamp would
    // shove the scene along with a live-dragged layer list it's supposed to
    // be able to sit under. It only pins where the scene *starts*.
    const taskbarNaturalW = collapsed ? TASKBAR_W_COLLAPSED : TASKBAR_W_EXPANDED;
    const taskbarNaturalRight = layerListReserveW + TASKBAR_OFFSET + taskbarNaturalW;
    panX = Math.max(panX, taskbarNaturalRight + TASKBAR_GAP);

    state.manualPanX = panX;
    state.manualPanY = panY;
  }

  sceneFrame.style.width = scene.w + 'px';
  sceneFrame.style.height = scene.h + 'px';
  sceneFrame.style.transition = state.animate ? 'width .2s ease, height .2s ease' : 'none';

  canvasContent.style.transition = state.animate ? 'transform .2s ease' : 'none';
  canvasContent.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;

  // Outer stroke is chrome too — same on-screen box as the scene frame,
  // but its border-width is a fixed CSS value untouched by the zoom
  // transform, so the line stays a crisp constant thickness at any zoom.
  sceneBorder.style.left = panX + 'px';
  sceneBorder.style.top = panY + 'px';
  sceneBorder.style.width = sceneWpx + 'px';
  sceneBorder.style.height = sceneHpx + 'px';
  sceneBorder.style.transition = state.animate ? 'left .2s ease, top .2s ease, width .2s ease, height .2s ease' : 'none';

  // Scene title + close control are chrome too (siblings of canvas-content,
  // never inside the scaled transform) so their font-size/padding stay put;
  // only their box is repositioned/resized to track the scene's screen box.
  sceneChrome.style.left = panX + 'px';
  sceneChrome.style.top = panY + 'px';
  sceneChrome.style.width = sceneWpx + 'px';
  sceneChrome.style.transition = state.animate ? 'left .2s ease, top .2s ease, width .2s ease' : 'none';

  // Inner content border is chrome too, inset from the outer border by a
  // fixed screen-space gap (not a scaled margin) so the title/close row
  // never collides with it and the gap between the two borders reads the
  // same at any zoom — this is what the scaled #scene-frame's own border/
  // margin used to get wrong.
  const SCENE_HEADER_H = 44; // matches #scene-chrome's own content height
  const SCENE_PAD = 12;      // matches the gap on the other three sides
  sceneInner.style.left = (panX + SCENE_PAD) + 'px';
  sceneInner.style.top = (panY + SCENE_HEADER_H) + 'px';
  sceneInner.style.width = Math.max(0, sceneWpx - 2*SCENE_PAD) + 'px';
  sceneInner.style.height = Math.max(0, sceneHpx - SCENE_HEADER_H - SCENE_PAD) + 'px';
  sceneInner.style.transition = state.animate ? 'left .2s ease, top .2s ease, width .2s ease, height .2s ease' : 'none';

  // Generation panel is chrome (a sibling of canvas-content, so its own
  // 360x575 size never changes with zoom) but stays docked GEN_PANEL_GAP off
  // the scene's on-screen right edge, top-aligned with it — tracking the
  // scene as it pans/zooms without scaling itself. Its z-index still sits
  // below the layer bar/task bar/right rail, so it slides behind that fixed
  // chrome the same way the scene itself does.
  genPanel.style.left = (panX + sceneWpx + GEN_PANEL_GAP) + 'px';
  genPanel.style.top = panY + 'px';
  genPanel.style.transition = state.animate ? 'left .2s ease, top .2s ease' : 'none';

  availOutline.style.left = localX0+'px';
  availOutline.style.top = localY0+'px';
  availOutline.style.width = availableWidth+'px';
  availOutline.style.height = availableHeight+'px';
  availOutline.classList.toggle('visible', state.showOutline);

  // readouts
  document.getElementById('r-viewport').textContent = `${Math.round(vw)} × ${Math.round(vh)}`;
  document.getElementById('r-avail').textContent = `${Math.round(availableWidth)} × ${Math.round(availableHeight)}`;
  document.getElementById('r-pad').textContent = state.altZoomRule ? 'n/a (alt rule)' : `${Math.round(padH)} / ${Math.round(padV)} px`;

  drawRulers(canvasW, canvasH);

  // Keep an open task bar sub-menu flyout (js/taskbar-submenu.js) glued to
  // its trigger row, since the task bar itself can move/animate here.
  if(typeof repositionOpenSubmenu==='function') repositionOpenSubmenu();
  // Same for a currently-showing hover preview tooltip (js/taskbar-tooltip.js).
  if(typeof repositionTaskbarTooltip==='function') repositionTaskbarTooltip();
}
