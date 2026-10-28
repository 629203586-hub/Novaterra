(() => {
  const api=window.EL,picker=document.querySelector('#languagePicker'),toggle=document.querySelector('#languageToggle'),menu=document.querySelector('#languageMenu');
  if(!api||!picker||!toggle||!menu)return;
  const label=document.querySelector('#languageLabel'),native=document.querySelector('#languageSelect'),options=[];
  for(const[locale,name]of Object.entries(api.languages)){
    const option=document.createElement('button');
    option.type='button';option.className='language-option';option.setAttribute('role','menuitemradio');option.setAttribute('lang',locale);option.setAttribute('dir','auto');option.dataset.locale=locale;option.tabIndex=-1;
    const text=document.createElement('span');text.textContent=name;option.append(text);
    const check=document.createElement('span');check.className='language-check';check.setAttribute('aria-hidden','true');check.textContent='✓';option.append(check);
    option.addEventListener('click',()=>{close(true);api.setLanguage(locale);});
    menu.append(option);options.push(option);
  }
  function sync(){
    label.textContent=api.languages[api.locale];
    toggle.setAttribute('aria-label',`${api.t('language')}: ${api.languages[api.locale]}`);
    menu.setAttribute('aria-label',api.t('language'));
    options.forEach(option=>option.setAttribute('aria-checked',String(option.dataset.locale===api.locale)));
  }
  function close(returnFocus=false){menu.hidden=true;toggle.setAttribute('aria-expanded','false');if(returnFocus)toggle.focus({preventScroll:true});}
  function open(){sync();menu.hidden=false;toggle.setAttribute('aria-expanded','true');const selected=options.find(option=>option.dataset.locale===api.locale)||options[0];selected.focus({preventScroll:true});selected.scrollIntoView({block:'nearest'});}
  toggle.addEventListener('click',()=>menu.hidden?open():close(true));
  toggle.addEventListener('keydown',event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();open();}else if(event.key==='Escape')close();});
  menu.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();close(true);return;}
    if(event.key==='Tab'){close(true);return;}
    let index=options.indexOf(document.activeElement);
    if(event.key==='ArrowDown')index=(index+1)%options.length;
    else if(event.key==='ArrowUp')index=(index-1+options.length)%options.length;
    else if(event.key==='Home')index=0;
    else if(event.key==='End')index=options.length-1;
    else return;
    event.preventDefault();options[index].focus({preventScroll:true});options[index].scrollIntoView({block:'nearest'});
  });
  document.addEventListener('pointerdown',event=>{if(!menu.hidden&&!picker.contains(event.target))close();});
  picker.addEventListener('focusout',event=>{if(!picker.contains(event.relatedTarget))close();});
  document.addEventListener('screenchange',()=>close());
  document.addEventListener('languagechange',sync);
  sync();native.hidden=true;picker.classList.add('is-enhanced');toggle.hidden=false;
})();
