// Drag-resize for the layer list: dragging #layerlist-resize-handle (a thin
// strip on its right edge) continuously resizes #layerlist between its
// collapsed and expanded extremes — the same range the "+" toggle button
// (js/hud.js) snaps between. The CSS width transition is suspended for the
// duration of the drag (restored after) since animating every mousemove
// frame would make the drag feel laggy instead of tracking the cursor.
//
// js/layout-engine.js's canvas-space math always assumes the panel is
// collapsed regardless of its real width, so dragging it wider is purely a
// visual overlay on top of the canvas — it never reflows or rescales the
// scene/generation panel, dragging or not, so no zoom/reservation freeze is
// needed here (there's nothing live to freeze).

let layerListDragStartX = 0;
let layerListDragStartWidth = 0;

function onLayerListDrag(e){
  const dx = e.clientX - layerListDragStartX;
  state.layerListWidth = clamp(LAYERLIST_W_COLLAPSED, layerListDragStartWidth + dx, LAYERLIST_W_EXPANDED);
  recompute();
}

function onLayerListDragEnd(){
  document.getElementById('layerlist-resize-handle').classList.remove('dragging');
  layerlistEl.style.transition = '';
  document.removeEventListener('mousemove', onLayerListDrag);
  document.removeEventListener('mouseup', onLayerListDragEnd);
}

document.getElementById('layerlist-resize-handle').addEventListener('mousedown', (e)=>{
  e.preventDefault();
  layerListDragStartX = e.clientX;
  layerListDragStartWidth = clamp(LAYERLIST_W_COLLAPSED, state.layerListWidth, LAYERLIST_W_EXPANDED);
  e.target.classList.add('dragging');
  layerlistEl.style.transition = 'none';
  document.addEventListener('mousemove', onLayerListDrag);
  document.addEventListener('mouseup', onLayerListDragEnd);
});
