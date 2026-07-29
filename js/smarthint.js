// Smart hint popup: a static top-right corner banner (doesn't track the
// scene, unlike the generation panel) that swaps between a big and a
// compact size at SMARTHINT_COMPACT_VW. This can't be a plain CSS media
// query — that reads the real browser window, but js/simulate.js's
// "Simulated viewport size" HUD buttons resize #stage directly without
// touching the window — so, like the task bar's own breakpoint, it has to
// read the same live vw js/layout-engine.js's recompute() already computes.

const smarthintEl = document.getElementById('smarthint');
const smarthintIcon = smarthintEl.querySelector('.sh-icon');

function updateSmartHint(vw){
  const compact = vw < SMARTHINT_COMPACT_VW;
  smarthintEl.classList.toggle('compact', compact);
  smarthintIcon.src = 'icons/' + (compact ? 'smarthint-sm.png' : 'smarthint-bg.png');
}

document.getElementById('smarthint-close').addEventListener('click', ()=>{
  smarthintEl.classList.add('hidden');
});
