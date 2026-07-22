// "Simulated viewport size" HUD buttons: letterbox #stage to a fixed
// width (or an exact width x height, for presets whose data-sim is
// "WxH" — e.g. the 1200×700 support floor) so breakpoints can be
// exercised without resizing the actual browser window.

document.querySelectorAll('.simbtns button').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.simbtns button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const sim = btn.getAttribute('data-sim');
    state.sim = sim;
    if(sim==='real'){
      stage.style.width='100%'; stage.style.height='100%';
      stage.classList.remove('simulated');
    } else if(sim.includes('x')){
      const [w,h] = sim.split('x').map(Number);
      stage.style.width = w+'px'; stage.style.height = h+'px';
      stage.classList.add('simulated');
    } else {
      stage.style.width = sim+'px'; stage.style.height='100%';
      stage.classList.add('simulated');
    }
    // Switching viewport size should refresh to a fresh fit for the new
    // size, not keep rendering whatever manual zoom/pan was left over from
    // before (which would be positioned for the old viewport).
    state.zoomMode = 'auto';
    document.querySelector('input[name=zoommode][value=auto]').checked = true;
    // Called directly (not via requestAnimationFrame) — recompute() reads
    // stage.getBoundingClientRect(), which forces a synchronous layout
    // reflecting the width/height just set above, so there's nothing to
    // wait a frame for.
    recompute();
  });
});
