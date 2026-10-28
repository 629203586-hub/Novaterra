import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=(await readFile(new URL('../dist/world-shell.js',import.meta.url),'utf8')).replaceAll('export function','function');

// A deterministic browser boundary runs the actual shell, including its error
// listeners, animation frames, retry timers, loading UI and local storage.
function createShell(){
  let now=0,nextId=0,removed=false;
  const tasks=new Map(),events=new Map(),classes=new Set(),storage=new Map([['elsewhere-visits','["france"]']]);
  const status={textContent:'YOUR LITTLE WORLD IS COMING TO LIFE'},actions={hidden:true};
  const loader={classList:{add:name=>classes.add(name),contains:name=>classes.has(name)},querySelector:selector=>selector==='.world-load-actions'?actions:null,remove(){removed=true;}};
  const clock={},notes={open:false,contains:()=>false};
  const body={dataset:{},classList:{contains:()=>false},style:{setProperty(){}}};
  const nativeLoading={classList:{contains:()=>false}};
  const config={textContent:JSON.stringify({id:'japan',zone:'Asia/Tokyo',timeNote:'Tokyo time'})};
  const elements={'#world-shell-config':config,'#world-loading':loader,'#world-load-status':status,'#world-clock':clock,'#world-notes':notes,'#loading':nativeLoading};
  const document={body,hidden:false,querySelector:selector=>elements[selector]??null,addEventListener(){}};
  const schedule=(callback,delay)=>{const id=++nextId;tasks.set(id,{at:now+Math.max(0,delay),callback});return id;};
  const context={document,Intl,Date,Map,JSON,Boolean,Array,Set,Math,innerHeight:720,
    matchMedia:()=>({matches:false}),performance:{now:()=>now},
    requestAnimationFrame:callback=>schedule(()=>callback(now),16),
    setTimeout:(callback,delay=0)=>schedule(callback,delay),clearTimeout:id=>tasks.delete(id),
    setInterval:()=>++nextId,MutationObserver:class{observe(){}},ResizeObserver:class{observe(){}},
    addEventListener:(type,callback)=>{const listeners=events.get(type)??[];listeners.push(callback);events.set(type,listeners);},
    localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value))}};
  context.window=context;
  vm.runInNewContext(source,context,{filename:'world-shell.js'});
  function advance(duration){
    const end=now+duration;let calls=0;
    for(;;){const next=[...tasks].filter(([,task])=>task.at<=end).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];if(!next)break;
      assert.ok(++calls<10000,'A retry should not spin indefinitely');const [id,task]=next;tasks.delete(id);now=task.at;task.callback();}
    now=end;
  }
  return{context,body,status,actions,classes,storage,advance,get removed(){return removed;},emit:(type,event={})=>{for(const listener of events.get(type)??[])listener(event);}};
}

test('a scene that becomes ready after a loading error dismisses the overlay and records its passport stamp',()=>{
  const shell=createShell();
  shell.emit('error',{message:'A temporary startup problem'});
  assert.match(shell.status.textContent,/could not load/i);
  assert.equal(shell.actions.hidden,false);
  shell.advance(1200);
  assert.equal(shell.body.dataset.worldReady,undefined);
  assert.equal(shell.classes.has('is-done'),false);
  assert.deepEqual(JSON.parse(shell.storage.get('elsewhere-visits')),['france']);

  shell.context.__sceneReady=true;
  shell.advance(1000);
  assert.equal(shell.body.dataset.worldReady,'true');
  assert.equal(shell.classes.has('is-done'),true);
  assert.deepEqual(JSON.parse(shell.storage.get('elsewhere-visits')),['france','japan']);
  shell.advance(1000);
  assert.equal(shell.removed,true);
  assert.deepEqual(JSON.parse(shell.storage.get('elsewhere-visits')),['france','japan']);
});

test('the long-loading timer preserves an earlier error and its recovery links',()=>{
  const shell=createShell();
  shell.emit('unhandledrejection',{reason:new Error('Initial load failed')});
  const errorText=shell.status.textContent;
  assert.match(errorText,/could not load/i);
  shell.advance(19000);
  assert.equal(shell.status.textContent,errorText);
  assert.equal(shell.actions.hidden,false);
  assert.equal(shell.body.dataset.worldReady,undefined);
});

test('the inline recovery links appear if the shared shell script fails to start',async()=>{
  const html=await readFile(new URL('../dist/france.html',import.meta.url),'utf8');
  const fallback=html.match(/<script id="world-shell-fallback">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(fallback,'the page needs an independent fallback');
  const status={textContent:'loading'},actions={hidden:true},classes=new Set(),callbacks=[];
  const document={querySelector:key=>({'#world-load-status':status,'.world-load-actions':actions,'#world-loading':{classList:{add:name=>classes.add(name)}}})[key]};
  const context={document,window:{},setTimeout:callback=>callbacks.push(callback)};
  vm.runInNewContext(fallback,context);callbacks[0]();
  assert.match(status.textContent,/reload/i);assert.equal(actions.hidden,false);assert.ok(classes.has('has-error'));
  status.textContent='loading';actions.hidden=true;context.window.__worldShellStarted=true;vm.runInNewContext(fallback,context);callbacks.at(-1)();
  assert.equal(status.textContent,'loading');assert.equal(actions.hidden,true);
});
