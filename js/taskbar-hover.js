// Hover-to-expand: when the task bar is collapsed (viewport under its
// trigger breakpoint, or state.taskbarForceCollapsed from a just-made
// sub-menu selection — see js/taskbar-submenu.js), hovering it shows the
// expanded layout; leaving collapses it back.
//
// cancelTaskbarCollapse()/scheduleTaskbarCollapse() are exposed globally so
// js/taskbar-submenu.js can keep this "hovered" while the mouse is over an
// open flyout, which sits outside the task bar's own bounding box (to its
// right) — without the grace period, crossing that gap would trigger
// mouseleave and yank the flyout closed before it could be clicked.

let taskbarLeaveTimer = null;

function cancelTaskbarCollapse(){
  clearTimeout(taskbarLeaveTimer);
}
function scheduleTaskbarCollapse(){
  clearTimeout(taskbarLeaveTimer);
  taskbarLeaveTimer = setTimeout(()=>{
    state.taskbarHovered = false;
    if(typeof closeSubmenu==='function') closeSubmenu();
    recompute();
  }, 200);
}

taskbar.addEventListener('mouseenter', ()=>{
  cancelTaskbarCollapse();
  state.taskbarHovered = true;
  state.taskbarForceCollapsed = false;
  recompute();
});
taskbar.addEventListener('mouseleave', scheduleTaskbarCollapse);
