import config from '../project.config.js';
import {buildScene} from '../scene.js';
import {createRuntime} from './core/runtime.js';
import {createRandom} from './core/random.js';
import {createLighting} from './core/lighting.js';
import {createSignage} from './world/signage.js';
import {createArchitecture} from './world/architecture.js';
import {createProps} from './world/props.js';
import {createTerrain} from './world/terrain.js';
import {createItalianArchitecture} from './world/architecture-italy.js';
import {createItalianProps} from './world/props-italy.js';
import {createActors} from './actors/models.js';
import {createSimulation} from './systems/simulation.js';
import {bindToolbar} from './ui/toolbar.js';
import {createFerrari} from './actors/ferrari.js';
import {createFerrariInspection} from './systems/inspection.js';
try{
 await document.fonts.ready;
 const ctx=createRuntime(config);ctx.signage=createSignage(ctx);ctx.architecture=createArchitecture(ctx);ctx.props=createProps(ctx);ctx.terrain=createTerrain(ctx);
 ctx.italianArch=createItalianArchitecture(ctx);ctx.italianProps=createItalianProps(ctx);
 const layout=buildScene(ctx);ctx.batch.flush();ctx.layout=layout;
 // the hero car: modeled outside the static batch, parked on the scenic overlook
 const ferrari=createFerrari(ctx,{x:-6.6,z:-1.3,y:3.27,rot:.55,color:'#b9141b'});
 if(!ferrari.group.parent)ctx.scene.add(ferrari.group);
 layout.ferrari=ferrari;
 ctx.obstacles.push({x:-6.6,z:-1.3,w:2.15,d:2.6,label:'ferrari'});
 const actors=createActors({...ctx,...createRandom(config.seed^0x9e3779b9)});
 const simulation=createSimulation({...ctx,...createRandom(config.seed^0x243f6a88)},layout,actors);
 const lighting=createLighting(ctx);ctx.lighting=lighting;const ui=bindToolbar(ctx,simulation);
 const inspection=createFerrariInspection(ctx,layout.ferrari,{proximity:34});ctx.inspection=inspection;
 const world={ready:true,config,ctx,layout,simulation,setTime:ui.setTime,cycle:kind=>{const mode=simulation.cycle(kind);ui.refresh();return mode;},reset:ctx.reset,diagnostics:()=>({state:{...ctx.state},camera:{position:ctx.camera.position.toArray(),target:ctx.controls.target.toArray(),zoom:ctx.camera.zoom},lighting:lighting.diagnostics(),presets:lighting.presets,toon:{materialCount:[...ctx.materials.values()].filter(m=>m.isMeshToonMaterial).length,gradientSteps:ctx.gradient.image.width},buildings:layout.buildings,sceneMeshes:ctx.scene.children.length,fps:ctx.fps,simulation:simulation.diagnostics(),inspection:inspection.debug?.(),ferrari:!!layout.ferrari}),dispose:()=>{inspection.dispose();ui.dispose();ctx.dispose();}};
 window.littleWorld=world;window.littleWorld.inspection=inspection;document.querySelector('#loading').classList.add('done');setTimeout(()=>document.querySelector('#loading').remove(),650);
 ctx.start(dt=>{lighting.update(dt);simulation.update(dt);inspection.update(dt);});
 addEventListener('pagehide',event=>{if(!event.persisted)world.dispose();});
}catch(error){console.error(error);document.querySelector('#loading-text').textContent='Unable to start this world';document.querySelector('#error').textContent=error.message;throw error;}
