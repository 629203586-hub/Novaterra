(() => {
  const dock=document.querySelector('.travel-dock'),items=[...dock.querySelectorAll('[data-dock]')];
  const panels=[...document.querySelectorAll('[data-screen-panel]')],order=panels.map(p=>p.id),motion=matchMedia('(prefers-reduced-motion: reduce)');
  let current='',timer;
  function setActive(){items.forEach(item=>{const active=item.dataset.dock===current;item.classList.toggle('is-active',active);if(active)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');});document.body.dataset.screen=current;document.querySelector('#chapterNumber').textContent=String(order.indexOf(current)+1).padStart(2,'0');}
  function finish(){clearTimeout(timer);panels.forEach(p=>p.classList.remove('is-entering','is-leaving'));}
  function navigateScreen(key,{history=true,focus=true,animate=true}={}){
    if(!order.includes(key))key='home';if(key===current)return;
    const previous=document.getElementById(current),next=document.getElementById(key);
    finish();if(document.querySelector('#detailDialog').open)document.querySelector('#detailDialog').close();
    panels.forEach(p=>{const active=p===next;p.classList.toggle('is-current',active);p.inert=!active;p.setAttribute('aria-hidden',String(!active));});
    const hadPrevious=Boolean(current);current=key;setActive();
    if(history){const hash=key==='home'?'#home':`#${key}`;window.history.pushState({screen:key},'',hash);}
    if(hadPrevious&&animate&&!motion.matches){previous.classList.add('is-leaving');next.classList.add('is-entering');timer=setTimeout(finish,650);}
    if(focus){const heading=next.querySelector('h1,h2');heading?.focus({preventScroll:true});}
    document.dispatchEvent(new CustomEvent('screenchange',{detail:{screen:key}}));
    window.dispatchEvent(new Event('resize'));
  }
  window.navigateScreen=navigateScreen;
  document.addEventListener('click',event=>{
    const link=event.target.closest('[data-screen-link]');if(!link||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();navigateScreen(link.dataset.screenLink);
  });
  document.querySelector('[data-focus-content]').addEventListener('click',e=>{e.preventDefault();document.getElementById(current).querySelector('h1,h2')?.focus({preventScroll:true});});
  const onHistory=()=>navigateScreen(location.hash.slice(1)||'home',{history:false});
  window.addEventListener('popstate',onHistory);window.addEventListener('hashchange',onHistory);
  navigateScreen(location.hash.slice(1)||'home',{history:false,focus:false,animate:false});
  const reset=()=>items.forEach(item=>{item.style.removeProperty('--dock-scale');item.style.removeProperty('--dock-lift');});
  dock.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||motion.matches)return;items.forEach(item=>{const r=item.getBoundingClientRect(),near=Math.max(0,1-Math.abs(e.clientX-(r.left+r.width/2))/110),strength=near*near;item.style.setProperty('--dock-scale',(1+strength*.22).toFixed(3));item.style.setProperty('--dock-lift',`${(-strength*5).toFixed(2)}px`);});});
  dock.addEventListener('pointerleave',reset);dock.addEventListener('focusout',reset);motion.addEventListener('change',()=>{reset();finish();});
  dock.addEventListener('keydown',e=>{const currentIndex=items.indexOf(document.activeElement);if(currentIndex<0)return;let index;const step=document.documentElement.dir==='rtl'?-1:1;if(e.key==='ArrowRight')index=(currentIndex+step+items.length)%items.length;else if(e.key==='ArrowLeft')index=(currentIndex-step+items.length)%items.length;else if(e.key==='Home')index=0;else if(e.key==='End')index=items.length-1;else return;e.preventDefault();items[index].focus();});
  document.addEventListener('click',e=>{const button=e.target.closest('button,a,summary');if(!button||motion.matches)return;button.classList.remove('click-feedback');requestAnimationFrame(()=>button.classList.add('click-feedback'));setTimeout(()=>button.classList.remove('click-feedback'),340);});
  if(window.initWorldGlobe)window.initWorldGlobe({onSelect:window.openCountry});
})();
