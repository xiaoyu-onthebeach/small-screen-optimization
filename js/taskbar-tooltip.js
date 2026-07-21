// Hover preview tooltip: hovering a task bar item (any item except Models)
// for 1s shows a passive preview flyout to the right of the task bar,
// top-aligned with that item's row. Moving off the item, or clicking it,
// dismisses it immediately — for Angle/Light, the click also opens the real
// submenu (js/taskbar-submenu.js), so this tooltip reads as a preview that
// gets replaced by the actual menu once you commit to a click.

const TOOLTIP_GAP = 12;
const TOOLTIP_DELAY = 1000;

let tooltipTimer = null;
let tooltipItem = null;

const tooltipEl = document.createElement('div');
tooltipEl.className = 'tb-hover-tooltip';
tooltipEl.style.display = 'none';
tooltipEl.innerHTML = '<div class="preview"></div>';
stage.appendChild(tooltipEl);

function positionTooltip(item){
  const stageRect = stage.getBoundingClientRect();
  const taskbarRect = taskbar.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  tooltipEl.style.left = (taskbarRect.right - stageRect.left + TOOLTIP_GAP) + 'px';
  tooltipEl.style.top = (itemRect.top - stageRect.top) + 'px';
}

function hideTaskbarTooltip(){
  clearTimeout(tooltipTimer);
  tooltipItem = null;
  tooltipEl.style.display = 'none';
}

// Keeps a showing tooltip glued to its row across recomputes (task bar
// animating open/closed, hover-expanding, viewport resize, etc) — same
// pattern as js/taskbar-submenu.js's repositionOpenSubmenu, called from
// js/layout-engine.js at the end of every recompute().
function repositionTaskbarTooltip(){
  if(tooltipItem) positionTooltip(tooltipItem);
}

document.querySelectorAll('#taskbar .item').forEach(item=>{
  if(item.id === 'taskbar-item-models') return;
  item.addEventListener('mouseenter', ()=>{
    clearTimeout(tooltipTimer);
    tooltipTimer = setTimeout(()=>{
      tooltipItem = item;
      positionTooltip(item);
      tooltipEl.style.display = 'block';
    }, TOOLTIP_DELAY);
  });
  item.addEventListener('mouseleave', hideTaskbarTooltip);
  item.addEventListener('click', hideTaskbarTooltip);
});
