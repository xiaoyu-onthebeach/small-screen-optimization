// Single mutable state object driving the layout engine, plus the one
// numeric helper it needs. Every HUD control (js/hud.js) writes into this.

const state = {
  altZoomRule:true,
  rule:'B',
  paddingMode:'hybrid',
  marginPct:10,
  fixedPad:64,
  padMin:48,
  padMax:160,
  maxZoomCap:100,
  zoomMode:'auto',
  manualZoom:100,
  // Explicit camera pan (canvas-local px) used only while zoomMode is
  // 'manual' — kept synced to the live auto-fit pan every recompute while
  // in auto mode, so the first cursor-wheel zoom (js/canvas-zoom.js) starts
  // from wherever the view currently sits instead of jumping.
  manualPanX:0,
  manualPanY:0,
  taskbarBreakpoint:1480,
  taskbarHovered:false,
  taskbarExpandMode:'overlay',
  // Set true right after a sub-menu selection (js/taskbar-submenu.js) so
  // the task bar collapses on the *next* mouse-leave even if it's
  // naturally expanded (wide viewport) — cleared again on the next
  // mouseenter so this is a one-shot effect, not a permanent override.
  taskbarForceCollapsed:false,
  // Which sub-menu flyout is currently open: null | 'models' | 'angle' | 'light'.
  taskbarOpenSubmenu:null,
  modelSelection:0,
  angleSelection:0,
  lightSelection:0,
  // Continuous drag-resizable width (js/layerlist-resize.js), clamped
  // between LAYERLIST_W_COLLAPSED and LAYERLIST_W_EXPANDED — the "+" button
  // (js/hud.js) just snaps this to whichever extreme it isn't currently at.
  layerListWidth:LAYERLIST_W_EXPANDED,
  scenePreset:'2048x2048',
  showOutline:false,
  animate:true,
  sim:'real',
};

function clamp(min,val,max){ return Math.min(Math.max(val,min),max); }

// Remembers a manually-set layer list width (drag-resize or the "+" toggle
// — see js/layerlist-resize.js and js/hud.js) across reloads, so the next
// visit computes its fit/zoom against the same reserved space rather than
// resetting to the default every time. try/catch guards against
// localStorage being unavailable (e.g. blocked by browser privacy
// settings) — this runs at top-level script load, so an uncaught throw
// here would abort every script after it.
const LAYERLIST_WIDTH_STORAGE_KEY = 'beachside.layerListWidth';

(function restoreLayerListWidth(){
  try{
    const saved = localStorage.getItem(LAYERLIST_WIDTH_STORAGE_KEY);
    if(saved === null) return;
    const n = Number(saved);
    if(!Number.isNaN(n)) state.layerListWidth = clamp(LAYERLIST_W_COLLAPSED, n, LAYERLIST_W_EXPANDED);
  }catch(e){}
})();

function persistLayerListWidth(){
  try{ localStorage.setItem(LAYERLIST_WIDTH_STORAGE_KEY, String(state.layerListWidth)); }catch(e){}
}
