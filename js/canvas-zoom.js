// Cursor-anchored wheel zoom: scrolling over the canvas viewport (the area
// between the top bar and the left/right chrome) zooms in/out centered on
// the mouse position, the same way most infinite-canvas apps behave. This
// always switches state.zoomMode to 'manual' (like dragging the slider
// does) since it's a direct, explicit override of the auto-fit view.
//
// #canvas is a DOM sibling of the layer bar / task bar / right rail (not a
// descendant), so the browser's own hit-testing already keeps wheel events
// over those panels from ever reaching this listener — no extra guards
// needed for that. The generation panel, now living inside canvas-content,
// intentionally *is* included: scrolling over it zooms the canvas too.

const ZOOM_WHEEL_SPEED = 0.0015;
const ZOOM_WHEEL_MIN = 0.05;
const ZOOM_WHEEL_MAX = 4;

canvasEl.addEventListener('wheel', (e)=>{
  e.preventDefault();

  const rect = canvasEl.getBoundingClientRect();
  const mouseX = e.clientX - rect.left; // canvas-local — same space as panX/panY
  const mouseY = e.clientY - rect.top;

  // manualPanX/Y are kept synced to the live auto-fit pan every recompute
  // while in auto mode, so this reads a sensible "current view" regardless
  // of whether the user has interacted yet.
  const oldZoom = state.manualZoom/100;
  const oldPanX = state.manualPanX;
  const oldPanY = state.manualPanY;

  const factor = Math.exp(-e.deltaY * ZOOM_WHEEL_SPEED);
  const newZoom = clamp(ZOOM_WHEEL_MIN, oldZoom*factor, ZOOM_WHEEL_MAX);

  // Keep the world point under the cursor stationary on screen.
  const worldX = (mouseX - oldPanX) / oldZoom;
  const worldY = (mouseY - oldPanY) / oldZoom;
  state.manualPanX = mouseX - worldX*newZoom;
  state.manualPanY = mouseY - worldY*newZoom;
  state.manualZoom = Math.round(newZoom*100);

  if(state.zoomMode!=='manual'){
    state.zoomMode = 'manual';
    document.querySelector('input[name=zoommode][value=manual]').checked = true;
  }

  recompute();
}, {passive:false});
