// Populates the two static-content components (task bar item rows, layer
// list thumbnails) that don't need to react to state — built once at load.

TASKBAR_ITEMS.forEach(([label,icon,submenuKey])=>{
  const d = document.createElement('div');
  d.className='item';
  d.setAttribute('data-label',label);
  if(submenuKey){
    d.id = 'taskbar-item-'+submenuKey;
    d.setAttribute('data-submenu', submenuKey);
  }
  // Submenu items use an inline SVG (ICON_SVG, recolored via fill=
  // "currentColor" — see js/icon-svgs.js) so js/taskbar-submenu.js can turn
  // it accent-blue on click, and swap it for a different icon on selection,
  // just by touching this element's innerHTML/CSS color. CSS mask-image
  // would be simpler but Chrome silently fails to load a mask-image URL
  // when the page itself is opened via file:// (confirmed — works fine
  // over http://), which this project must support for double-click use.
  let icHtml;
  if(submenuKey && ICON_SVG[icon]){
    icHtml = `<span class="ic">${ICON_SVG[icon]}</span>`;
  } else if(icon.endsWith('.svg')){
    icHtml = `<img class="ic" src="icons/${icon}" alt="">`;
  } else {
    icHtml = `<span class="ic">${icon}</span>`;
  }
  const chevHtml = submenuKey ? ICON_CHEVRON : '';
  d.innerHTML = `${icHtml}<span class="lbl">${label}</span>${chevHtml}`;
  taskbar.appendChild(d);
});

for(let i=1;i<=9;i++){
  const row = document.createElement('div');
  row.className='litem';
  row.innerHTML = `<div class="thumb"></div><span class="llbl">Scene ${i}</span>`;
  layerlistEl.appendChild(row);
}
