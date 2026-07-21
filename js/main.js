// Bootstrap: recompute on any stage size change (covers real window
// resize and simulated-viewport swaps), then run the first layout pass.

const ro = new ResizeObserver(()=>recompute());
ro.observe(stage);
window.addEventListener('resize', recompute);

recompute();
if(typeof fitTaskbarToContent==='function') fitTaskbarToContent();
