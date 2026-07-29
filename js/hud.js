// Wires every debug-HUD control to `state` and triggers a recompute().
// (Simulated-viewport buttons are wired separately in js/simulate.js.)

document.getElementById('altZoomRule').addEventListener('change',e=>{
  state.altZoomRule=e.target.checked;
  const hideWhenAlt = state.altZoomRule ? 'none' : '';
  document.getElementById('fitRuleSec').style.display = hideWhenAlt;
  document.getElementById('paddingModeSec').style.display = hideWhenAlt;
  document.getElementById('maxZoomSec').style.display = hideWhenAlt;
  recompute();
});
document.querySelectorAll('input[name=rule]').forEach(r=>r.addEventListener('change',e=>{state.rule=e.target.value;recompute();}));
document.querySelectorAll('input[name=padmode]').forEach(r=>r.addEventListener('change',e=>{
  state.paddingMode=e.target.value;
  document.getElementById('ctrl-pct').style.display = state.paddingMode==='percentage' ? '' : 'none';
  document.getElementById('ctrl-fixed').style.display = state.paddingMode==='fixed' ? '' : 'none';
  document.getElementById('ctrl-hybrid').style.display = state.paddingMode==='hybrid' ? '' : 'none';
  recompute();
}));
document.getElementById('marginPct').addEventListener('input',e=>{state.marginPct=+e.target.value;document.getElementById('v-marginPct').textContent=state.marginPct;recompute();});
document.getElementById('fixedPad').addEventListener('input',e=>{state.fixedPad=+e.target.value;document.getElementById('v-fixedPad').textContent=state.fixedPad;recompute();});
document.getElementById('padMin').addEventListener('input',e=>{state.padMin=+e.target.value;document.getElementById('v-padMin').textContent=state.padMin;recompute();});
document.getElementById('padMax').addEventListener('input',e=>{state.padMax=+e.target.value;document.getElementById('v-padMax').textContent=state.padMax;recompute();});
document.getElementById('maxZoom').addEventListener('input',e=>{state.maxZoomCap=+e.target.value;document.getElementById('v-maxZoom').textContent=state.maxZoomCap;recompute();});
document.querySelectorAll('input[name=zoommode]').forEach(r=>r.addEventListener('change',e=>{state.zoomMode=e.target.value;recompute();}));
document.getElementById('manualZoom').addEventListener('input',e=>{
  state.manualZoom=+e.target.value;
  document.getElementById('v-manualZoom').textContent=state.manualZoom;
  if(state.zoomMode!=='manual'){
    state.zoomMode='manual';
    document.querySelector('input[name=zoommode][value=manual]').checked=true;
  }
  recompute();
});
document.getElementById('taskbarBreakpoint').addEventListener('input',e=>{state.taskbarBreakpoint=+e.target.value;document.getElementById('v-taskbarBreakpoint').textContent=state.taskbarBreakpoint;recompute();});
document.querySelectorAll('input[name=tbExpandMode]').forEach(r=>r.addEventListener('change',e=>{state.taskbarExpandMode=e.target.value;recompute();}));
document.getElementById('layerlist-toggle').addEventListener('click',()=>{
  state.layerListWidth = state.layerListWidth > LAYERLIST_W_COLLAPSED ? LAYERLIST_W_COLLAPSED : LAYERLIST_W_EXPANDED;
  recompute();
});
document.querySelectorAll('input[name=scene]').forEach(r=>r.addEventListener('change',e=>{state.scenePreset=e.target.value;recompute();}));
document.getElementById('showOutline').addEventListener('change',e=>{state.showOutline=e.target.checked;recompute();});
document.getElementById('animate').addEventListener('change',e=>{state.animate=e.target.checked;});

document.getElementById('hud-hide').addEventListener('click',()=>{
  document.getElementById('hud').style.display='none';
  document.getElementById('hud-collapsed-btn').style.display='block';
});
document.getElementById('hud-collapsed-btn').addEventListener('click',()=>{
  document.getElementById('hud').style.display='block';
  document.getElementById('hud-collapsed-btn').style.display='none';
});
