export function bindToolbar(ctx,simulation){
 const {state,config}=ctx,listeners=[];const listen=(el,type,fn)=>{if(!el)return;el.addEventListener(type,fn);listeners.push(()=>el.removeEventListener(type,fn));};
 document.title='Italian Hill Town / Vallenuova — Little Elsewhere';
 document.querySelector('#world-title').innerHTML='<span lang="en">Italian Hill Town</span><span class="slash" aria-hidden="true"> / </span><span lang="it">Vallenuova</span>';
 document.querySelector('#subtitle').textContent='A slow afternoon in a little Italian hill town.';document.querySelector('#loading-title').textContent=config.title;
 const orbit=document.querySelector('#orbit'),light=document.querySelector('#time'),pause=document.querySelector('#life');let timer;
 function toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('show');clearTimeout(timer);timer=setTimeout(()=>el.classList.remove('show'),1800);}
 function refresh(){const preset=state.preset??(state.night?'night':'day');document.body.dataset.time=preset;
 light.querySelector('span').textContent={day:'Day',sunset:'Sunset',night:'Night'}[preset];light.setAttribute('aria-label',`Time of day: ${preset}. Switch to ${{day:'sunset',sunset:'night',night:'day'}[preset]}.`);
 const cap=config.lighting.captions?.[preset];if(cap)document.querySelector('#caption').textContent=cap;
 orbit.setAttribute('aria-pressed',String(state.orbit));pause.setAttribute('aria-pressed',String(state.paused));pause.querySelector('span').textContent=state.paused?'Play':'Pause';pause.setAttribute('aria-label',state.paused?'Resume scene animation':'Pause scene animation');
 for(const kind of['traffic','people']){const b=document.querySelector('#'+kind),mode=state[kind+'Mode'];b.dataset.mode=mode;b.setAttribute('aria-pressed',mode==='active'?'true':mode==='paused'?'mixed':'false');b.setAttribute('aria-label',`${kind==='traffic'?'Traffic':'People'}: ${mode==='active'?'moving':mode}. Click to ${{active:'pause',paused:'hide',hidden:'resume'}[mode]}.`);b.title=b.getAttribute('aria-label');}}
 function setTime(preset){state.night=preset==='night';state.preset=preset;ctx.lighting?.setTime?.(preset);refresh();}
 listen(light,'click',()=>setTime({day:'sunset',sunset:'night',night:'day'}[state.preset]||'day'));
 listen(orbit,'click',()=>{ctx.setOrbit(!state.orbit);refresh();});
 for(const kind of['traffic','people'])listen(document.querySelector('#'+kind),'click',()=>{const mode=simulation.cycle(kind);toast(`${kind==='traffic'?'Traffic':'People'}: ${{active:'moving',paused:'paused',hidden:'hidden'}[mode]}`);refresh();});
 listen(document.querySelector('#reset'),'click',()=>{ctx.reset();toast('The whole Italian hill town');});
 listen(pause,'click',()=>{state.paused=!state.paused;refresh();});
 listen(window,'keydown',e=>{if(/INPUT|TEXTAREA|BUTTON|SELECT/.test(e.target.tagName))return;if(e.key==='1')setTime('day');if(e.key==='2')setTime('sunset');if(e.key==='3')setTime('night');if(e.key.toLowerCase()==='r')ctx.reset();if(e.code==='Space'){e.preventDefault();state.paused=!state.paused;refresh();toast(state.paused?'World paused':'World resumed');}});
 listen(matchMedia('(prefers-reduced-motion: reduce)'),'change',refresh);
 refresh();return {setTime,refresh,dispose:()=>{clearTimeout(timer);listeners.forEach(f=>f());}};
}
