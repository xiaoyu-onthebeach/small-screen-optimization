// Cosmetic top/left ruler tick labels, redrawn on every recompute().

function drawRulers(vw, vh){
  const top = document.getElementById('ruler-top');
  const left = document.getElementById('ruler-left');
  top.querySelectorAll('.ruler-label').forEach(e=>e.remove());
  left.querySelectorAll('.ruler-label').forEach(e=>e.remove());
  for(let x=0; x<vw; x+=200){
    const l = document.createElement('div');
    l.className='ruler-label';
    l.style.left = (x+3)+'px'; l.style.top='4px';
    l.textContent = x;
    top.appendChild(l);
  }
  for(let y=0; y<vh; y+=200){
    const l = document.createElement('div');
    l.className='ruler-label';
    l.style.top=(y+3)+'px'; l.style.left='2px';
    l.textContent = y;
    left.appendChild(l);
  }
}
