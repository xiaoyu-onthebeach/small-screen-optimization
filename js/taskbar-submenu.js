// Task bar sub-menu flyouts (Models / Angle / Light): clicking one of these
// three items opens a flyout to the right of the task bar and turns the
// trigger's icon+label accent-blue. Picking an option there updates the
// selection (checkmark moves), closes the flyout, and marks the task bar
// to auto-collapse the next time the mouse leaves it (js/taskbar-hover.js
// reads state.taskbarForceCollapsed) — even if it's naturally expanded —
// since making a selection is treated as "done with this panel for now".

const SUBMENUS = {
  models: {options: MODEL_OPTIONS, richList: true, icon: 'models.svg'},
  angle:  {options: ANGLE_OPTIONS, richList: false, icon: 'angle.svg'},
  light:  {options: LIGHT_OPTIONS, richList: false, icon: 'light.svg'},
};

const SELECTION_KEY = {models: 'modelSelection', angle: 'angleSelection', light: 'lightSelection'};

function iconGlyphHtml(icon){
  return ICON_SVG[icon] ? `<span class="tb-icon-glyph">${ICON_SVG[icon]}</span>` : '';
}

// Build each flyout once (hidden), as a direct child of #stage so its
// position:absolute offsets are relative to the same box the task bar
// itself is positioned in.
Object.keys(SUBMENUS).forEach(key=>{
  const cfg = SUBMENUS[key];
  const wrap = document.createElement('div');
  wrap.className = 'tb-flyout-wrap';
  wrap.id = 'tb-flyout-wrap-'+key;
  wrap.style.display = 'none';

  const itemsHtml = cfg.options.map((opt,idx)=>{
    if(cfg.richList){
      // Models without their own icon (no source asset provided) show an
      // empty placeholder box, matching the reference design.
      return `<div class="tb-model-item" data-idx="${idx}">
        <div class="tb-model-icon">${iconGlyphHtml(opt.icon)}</div>
        <div class="tb-model-text">
          <div class="tb-model-title">${opt.title}</div>
          <div class="tb-model-desc">${opt.desc}</div>
        </div>
        <span class="tb-check">${ICON_CHECK_SM}</span>
      </div>`;
    }
    return `<div class="tb-option-item" data-idx="${idx}">
      <div class="tb-option-icon">${iconGlyphHtml(opt.icon || cfg.icon)}</div>
      <span class="tb-option-title">${opt.title}</span>
      <span class="tb-check-md">${ICON_CHECK_MD}</span>
    </div>`;
  }).join('');

  const panelClass = cfg.richList ? 'tb-flyout tb-flyout-models' : 'tb-flyout tb-flyout-options';
  wrap.innerHTML = `<div class="${panelClass}" id="tb-flyout-${key}">${itemsHtml}</div>`;
  stage.appendChild(wrap);

  // Moving the mouse from the task bar to its flyout crosses outside the
  // task bar's own box (the flyout sits to its right) — without this, that
  // gap would trigger the task bar's mouseleave and yank the flyout closed
  // before the user can click anything in it.
  wrap.addEventListener('mouseenter', ()=>{ if(typeof cancelTaskbarCollapse==='function') cancelTaskbarCollapse(); });
  wrap.addEventListener('mouseleave', ()=>{ if(typeof scheduleTaskbarCollapse==='function') scheduleTaskbarCollapse(); });
});

function renderFlyoutSelection(key){
  const panel = document.getElementById('tb-flyout-'+key);
  const selIdx = state[SELECTION_KEY[key]];
  panel.querySelectorAll('[data-idx]').forEach(el=>{
    el.classList.toggle('selected', Number(el.getAttribute('data-idx'))===selIdx);
  });
}

function positionFlyout(key){
  const wrap = document.getElementById('tb-flyout-wrap-'+key);
  const trigger = document.getElementById('taskbar-item-'+key);
  if(!trigger) return;
  const stageRect = stage.getBoundingClientRect();
  const taskbarRect = taskbar.getBoundingClientRect();
  const triggerRect = trigger.getBoundingClientRect();
  const GAP = 12;
  wrap.style.left = (taskbarRect.right - stageRect.left + GAP) + 'px';
  wrap.style.top = (triggerRect.top - stageRect.top) + 'px';
}

function closeSubmenu(){
  if(!state.taskbarOpenSubmenu) return;
  const key = state.taskbarOpenSubmenu;
  document.getElementById('tb-flyout-wrap-'+key).style.display = 'none';
  state.taskbarOpenSubmenu = null;
}

function openSubmenu(key){
  if(state.taskbarOpenSubmenu === key){
    closeSubmenu();
    return;
  }
  closeSubmenu();
  state.taskbarOpenSubmenu = key;
  // Opening the flyout does NOT turn the trigger blue — that only happens
  // once a sub-item has actually been picked (see the selection handler
  // below), since .active now means "has a selection", not "menu is open".
  renderFlyoutSelection(key);
  positionFlyout(key);
  document.getElementById('tb-flyout-wrap-'+key).style.display = 'block';
}

// Keeps an open flyout glued to its trigger row across recomputes (task
// bar animating open/closed, hover-expanding, viewport resize, etc).
// Called from js/layout-engine.js at the end of every recompute().
function repositionOpenSubmenu(){
  if(state.taskbarOpenSubmenu) positionFlyout(state.taskbarOpenSubmenu);
}

// A swapped-in label (e.g. "Precise mode") can be wider than any of the
// task bar's default item labels, which the fixed CSS width was only ever
// sized for — .lbl's flex:1 + ellipsis would silently truncate it instead
// of the bar growing. This measures the actual shortfall and widens
// #taskbar (via an inline override) just enough to fit, re-shrinking back
// to the CSS default first so a later, shorter selection isn't stuck wide.
// No-ops while collapsed, since labels are hidden (and unmeasurable) then;
// the resulting width is a persistent inline style, so it's already correct
// by the time the bar is next hover-expanded.
function fitTaskbarToContent(){
  if(taskbar.classList.contains('collapsed')) return;
  taskbar.style.width = '';
  let extra = 0;
  taskbar.querySelectorAll('.item .lbl').forEach(lbl=>{
    extra = Math.max(extra, lbl.scrollWidth - lbl.clientWidth);
  });
  if(extra > 0){
    const natural = taskbar.getBoundingClientRect().width;
    taskbar.style.width = Math.ceil(natural + extra + 1) + 'px';
  }
}

Object.keys(SUBMENUS).forEach(key=>{
  document.getElementById('taskbar-item-'+key).addEventListener('click', (e)=>{
    e.stopPropagation();
    openSubmenu(key);
  });
});

document.addEventListener('click', (e)=>{
  const item = e.target.closest('[data-idx]');
  if(item){
    const wrap = item.closest('.tb-flyout-wrap');
    if(wrap){
      const key = wrap.id.replace('tb-flyout-wrap-','');
      const idx = Number(item.getAttribute('data-idx'));
      state[SELECTION_KEY[key]] = idx;

      // Swap the task bar item's own icon and label to the selected option's
      // — falling back to the category default icon (models.svg/angle.svg/
      // light.svg) for options with no specific icon of their own, so
      // e.g. picking "Seedream 4" after "GPT4o" reverts Models' icon back.
      // This selection is also what turns the row accent-blue (.active) —
      // opening the menu alone does not, see openSubmenu() — and it stays
      // blue from here on, since it now reflects "showing a picked option"
      // rather than "menu currently open".
      const cfg = SUBMENUS[key];
      const opt = cfg.options[idx];
      const trigger = document.getElementById('taskbar-item-'+key);
      const triggerIcon = trigger.querySelector('.ic');
      const triggerLbl = trigger.querySelector('.lbl');
      const iconFile = opt.icon || cfg.icon;
      if(triggerIcon && ICON_SVG[iconFile]) triggerIcon.innerHTML = ICON_SVG[iconFile];
      if(triggerLbl) triggerLbl.textContent = opt.title;
      // Only one of Models/Angle/Light shows as "selected" (blue) at a time —
      // picking an option in one clears the others' selected state.
      Object.keys(SUBMENUS).forEach(otherKey=>{
        document.getElementById('taskbar-item-'+otherKey).classList.toggle('active', otherKey===key);
      });
      fitTaskbarToContent();

      closeSubmenu();
      state.taskbarForceCollapsed = true;
      recompute();
      return;
    }
  }
  // Click outside an open flyout (and its own trigger, which already
  // stopped propagation above) closes it.
  if(state.taskbarOpenSubmenu){
    const wrap = document.getElementById('tb-flyout-wrap-'+state.taskbarOpenSubmenu);
    if(!wrap.contains(e.target)) closeSubmenu();
  }
});
