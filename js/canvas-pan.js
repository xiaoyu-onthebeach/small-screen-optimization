// Click-and-drag panning: press anywhere on the canvas viewport (including
// over the scene/gen panel, which live inside it) and drag to move the
// view — the standard direct-manipulation pan for an infinite canvas.
// Like wheel-zoom, this switches to manual zoom mode on first use (a pan
// is just as much a direct camera override as a zoom is) and writes
// straight into state.manualPanX/Y, which js/layout-engine.js already
// treats as the source of truth for pan while in manual mode.
//
// Listens on window for move/up (not just #canvas) so a drag that leaves
// the canvas bounds — cursor slides over the HUD, or off-window — doesn't
// get stuck "stuck down" with no matching mouseup to end it.

let isPanning = false;
let panStartClientX = 0, panStartClientY = 0;
let panOriginX = 0, panOriginY = 0;

canvasEl.addEventListener('mousedown', (e)=>{
  if(e.button !== 0) return; // left button only
  isPanning = true;
  panStartClientX = e.clientX;
  panStartClientY = e.clientY;
  panOriginX = state.manualPanX;
  panOriginY = state.manualPanY;
  canvasEl.classList.add('panning');
  document.body.classList.add('panning-active');
  e.preventDefault();
});

window.addEventListener('mousemove', (e)=>{
  if(!isPanning) return;

  if(state.zoomMode!=='manual'){
    state.zoomMode = 'manual';
    document.querySelector('input[name=zoommode][value=manual]').checked = true;
  }
  state.manualPanX = panOriginX + (e.clientX - panStartClientX);
  state.manualPanY = panOriginY + (e.clientY - panStartClientY);
  recompute();
});

window.addEventListener('mouseup', ()=>{
  if(!isPanning) return;
  isPanning = false;
  canvasEl.classList.remove('panning');
  document.body.classList.remove('panning-active');
});
