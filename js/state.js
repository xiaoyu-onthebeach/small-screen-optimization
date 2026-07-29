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
  taskbarBreakpoint:1513,
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
  // Always starts collapsed (js/layout-engine.js's canvas-space math also
  // permanently assumes collapsed, regardless of this value — expanding is
  // purely a visual overlay on top of the canvas, see its own comment).
  layerListWidth: LAYERLIST_W_COLLAPSED,
  scenePreset:'2048x2048',
  showOutline:false,
  animate:true,
  sim:'real',
};

function clamp(min,val,max){ return Math.min(Math.max(val,min),max); }
