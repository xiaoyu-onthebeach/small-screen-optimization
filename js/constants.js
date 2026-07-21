// Static content + layout constants shared by every other script.
// Loaded first: nothing here depends on the DOM being built yet.

// Second field is either an SVG filename in icons/ (matched to the label by
// name) or, where no matching SVG exists (Blend), an emoji fallback glyph.
// Third field, where present, is the sub-menu key (js/taskbar-submenu.js) —
// these three items get a chevron and open a flyout on click instead of
// just being a plain row.
const TASKBAR_ITEMS = [
  ['Models','models.svg','models'],['Combo','combo.svg'],['Blend','blend.svg'],
  ['Angle','angle.svg','angle'],['Light','light.svg','light'],
  ['Remove','remove.svg'],['Segment','extract.svg'],['Retouch','retouch.svg'],['Upscale','upscale.svg'],
  ['Expand','Expand.svg'],['Replicate','replicate.svg']
];

// Sub-menu flyout content. Models is the "rich list" style (icon + title +
// description); Angle/Light are the compact "Layer options" style (icon +
// title only). Where an option has its own `icon`, js/taskbar-submenu.js
// shows it in the flyout row AND swaps the task bar item's own icon to it
// on selection; options without one (no source asset provided) leave the
// flyout row's icon box empty and, on selection, revert the task bar
// item's icon back to the category default (models.svg/angle.svg/light.svg).
const MODEL_OPTIONS = [
  {title:'GPT4o', desc:'Clear, reliable images from any prompt', icon:'chatgpt4.svg'},
  {title:'Seedream 4', desc:'High-detail visuals with advanced prompt alignment'},
  {title:'Seedream 3', desc:'Fast, polished imagery with strong prompt alignment'},
  {title:'Qwen', desc:'Polished, multilingual visuals with seamless style control'},
  {title:'Imagen 4', desc:'Photorealistic, detailed imagery with fast typography precision'},
  {title:'Recraft', desc:'Consistent visual generation for creative workflows'},
];
const ANGLE_OPTIONS = [
  {title:'Quick angle', icon:'angle-quick.svg'},
  {title:'Precise angle', icon:'angle-precise.svg'},
];
const LIGHT_OPTIONS = [
  {title:'Directional', icon:'directional-light.svg'},
  {title:'Point', icon:'point-light 24.svg'},
];

// Small, hand-written (not file-sourced) inline icons — simple enough to
// keep inline safely, unlike the task bar's own multi-path icon files.
const ICON_CHEVRON = '<svg class="chev" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_CHECK_SM = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6.3L4.6 8.5L9.5 3.3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_CHECK_MD = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.3L6 10.8L12.5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const TOPBAR_H = 56;
const LAYERLIST_W_EXPANDED = 328;
const LAYERLIST_W_COLLAPSED = 88;
const TASKBAR_OFFSET = 16;   // gap from layer list right edge to taskbar left edge
const TASKBAR_W_EXPANDED = 230;
const TASKBAR_W_COLLAPSED = 64;
const RAIL_W = 40;
const PANEL_W = 360;
const PANEL_INSET = 24;
const BOTTOM_CLEARANCE = 80;

const SCENE_PRESETS = {
  '2048x2048':{w:2048,h:2048},
  '2368x1728':{w:2368,h:1728},
  '1536x2688':{w:1536,h:2688},
  '1024x1024':{w:1024,h:1024},
};

// Fit zoom is computed against this fixed size, not the active preset's own
// w/h — so switching presets scales true-to-size relative to one another
// (a 1024 scene renders at half the linear size of a 2048 one) instead of
// each preset independently stretching to fill the same on-screen footprint.
const REFERENCE_SIZE = {w:2048, h:2048};
