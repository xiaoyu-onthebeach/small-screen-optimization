// Cached references to the top-level element for each component, shared
// across the other scripts so they don't each re-query the DOM.

const stage = document.getElementById('stage');
const page = document.getElementById('page');
const layerlistEl = document.getElementById('layerlist');
const taskbar = document.getElementById('taskbar');
const genPanel = document.getElementById('gen-panel');
const canvasEl = document.getElementById('canvas');
const canvasContent = document.getElementById('canvas-content');
const sceneFrame = document.getElementById('scene-frame');
const sceneBorder = document.getElementById('scene-border');
const sceneInner = document.getElementById('scene-inner');
const sceneChrome = document.getElementById('scene-chrome');
const availOutline = document.getElementById('avail-outline');
