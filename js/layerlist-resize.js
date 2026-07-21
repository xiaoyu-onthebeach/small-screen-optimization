// Drag-resize for the layer list: dragging #layerlist-resize-handle (a thin
// strip on its right edge) continuously resizes #layerlist between its
// collapsed and expanded extremes — the same range the "+" toggle button
// (js/hud.js) snaps between. The CSS width transition is suspended for the
// duration of the drag (restored after) since animating every mousemove
// frame would make the drag feel laggy instead of tracking the cursor.
//
// layerListDragging/layerListDragStartWidth/layerListDragFrozenZoom (read by
// js/layout-engine.js) hold both zoom AND the canvas's space reservation
// fixed for the duration of the drag — the panel (and the task bar riding
// alongside it) grow/shrink live as a floating overlay on top of the
// canvas, without reflowing or rescaling the scene/generation panel
// underneath mid-drag. Both freezes lift the instant the drag ends, letting
// the canvas settle fit to the final width — which is also persisted
// (js/state.js) so a reload fits against that same reserved space instead
// of resetting to default.

let layerListDragging = false;
let layerListDragFrozenZoom = null;
let layerListDragStartX = 0;
let layerListDragStartWidth = 0;

function onLayerListDrag(e){
  const dx = e.clientX - layerListDragStartX;
  state.layerListWidth = clamp(LAYERLIST_W_COLLAPSED, layerListDragStartWidth + dx, LAYERLIST_W_EXPANDED);
  recompute();
}

function onLayerListDragEnd(){
  layerListDragging = false;
  layerListDragFrozenZoom = null;
  document.getElementById('layerlist-resize-handle').classList.remove('dragging');
  layerlistEl.style.transition = '';
  document.removeEventListener('mousemove', onLayerListDrag);
  document.removeEventListener('mouseup', onLayerListDragEnd);
  persistLayerListWidth();
  // Zoom was frozen throughout the drag — recompute once more now that
  // it's lifted, so the view settles fit to the final width.
  recompute();
}

document.getElementById('layerlist-resize-handle').addEventListener('mousedown', (e)=>{
  e.preventDefault();
  layerListDragStartX = e.clientX;
  layerListDragStartWidth = clamp(LAYERLIST_W_COLLAPSED, state.layerListWidth, LAYERLIST_W_EXPANDED);
  // Mark manual *before* the first drag recompute — otherwise
  // layout-engine.js's reactive default would immediately overwrite
  // layerListWidth with the breakpoint value on the very next frame,
  // fighting the drag from the first pixel of movement.
  state.layerListWidthManuallySet = true;
  layerListDragging = true;
  layerListDragFrozenZoom = state.currentZoom;
  e.target.classList.add('dragging');
  layerlistEl.style.transition = 'none';
  document.addEventListener('mousemove', onLayerListDrag);
  document.addEventListener('mouseup', onLayerListDragEnd);
});
