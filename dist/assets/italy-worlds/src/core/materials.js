import * as THREE from '../../vendor/three/build/three.module.js';
export function createMaterials(palette={}){
const gradient=new THREE.DataTexture(new Uint8Array([85,170,255]),3,1,THREE.RedFormat);gradient.minFilter=gradient.magFilter=THREE.NearestFilter;gradient.needsUpdate=true;
const materials=new Map(),emissives=[],nightLights=[];
function mat(color,extra={}){const key=color+JSON.stringify(Object.entries(extra).map(([k,v])=>[k,v?.isTexture?v.uuid:v]));if(materials.has(key))return materials.get(key);const m=new THREE.MeshToonMaterial({color:palette[color]??color,gradientMap:gradient,...extra});if(extra.emissive){m.userData.nightEmission=extra.emissiveIntensity??1;emissives.push(m);}materials.set(key,m);return m;}
const M={stone:mat('#768087'),stoneLight:mat('#a2a49b'),concrete:mat('#aaa99d'),sand:mat('#b2aa98'),slate:mat('#66717a'),dark:mat('#243447'),black:mat('#151f2b'),iron:mat('#34454c'),metal:mat('#9bacae'),wood:mat('#915e3a'),woodLight:mat('#c3945c'),red:mat('#b63828'),orange:mat('#e48b2f'),cream:mat('#dfca98'),green:mat('#45745e'),jade:mat('#477c77'),blue:mat('#266ca1'),tank:mat('#397fa5'),brick:mat('#87695b'),maroon:mat('#793f3c'),white:mat('#e0dfd2'),glass:mat('#293b48'),warm:mat('#d38b39',{emissive:'#ff9e26',emissiveIntensity:1.1}),warmDim:mat('#ad7641',{emissive:'#f7b65e',emissiveIntensity:.55}),windowDark:mat('#263b40'),neonRed:mat('#e9482b',{emissive:'#ff3216',emissiveIntensity:2.4}),neonBlue:mat('#4774db',{emissive:'#457bff',emissiveIntensity:2.1}),neonPink:mat('#b556ad',{emissive:'#ff39b4',emissiveIntensity:1.9}),lamp:mat('#f1cc8c',{emissive:'#ffd38c',emissiveIntensity:2.6}),leaf:mat('#65853d'),leaf2:mat('#91a746'),leafDark:mat('#456733'),blossom:mat('#ce9fa9'),blossom2:mat('#e9b8bc'),skin1:mat('#dbab87'),skin2:mat('#bd8968'),skin3:mat('#90624b'),skin4:mat('#ecc2a0'),hair:mat('#292b30'),hair2:mat('#655043'),hair3:mat('#979c9c'),
// ---- Italy: stone, stucco, shutters, awnings, terracotta, Mediterranean greens ----
trimStone:mat('#d6c7a6'),trimLightStone:mat('#e4d7bb'),trimLight:mat('#ece1c8'),trimWhite:mat('#f1eadb'),trimDark:mat('#b9a888'),trimWhiteStone:mat('#e8e0cc'),
paintShadow:mat('#3a3d3a'),signFrameIt:mat('#33302a'),archDark:mat('#1f2a2c'),clockFace:mat('#f2ecd9'),
shutterGreen:mat('#45684f'),shutterBrown:mat('#6f4a33'),shutterBlue:mat('#3f5f72'),shutterGrey:mat('#8a8d84'),
awningRose:mat('#b8503f'),awningGreen:mat('#4c6f52'),awningCream:mat('#efe3c6'),awningStripe:mat('#c09a58'),
woodDoor:mat('#6b4527'),woodDark:mat('#4a2f1d'),brass:mat('#c9a35a'),zinc:mat('#9aa6a6'),
terracotta:mat('#b4643f'),terracottaDark:mat('#8f4a2f'),stoneRoof:mat('#8f8f8a'),stoneRoofLight:mat('#a6a49d'),
leafOlive:mat('#6c7c42'),leafCypress:mat('#33492f'),leafPine:mat('#42582f'),leafVine:mat('#5b7a34'),grape:mat('#5a4a6b'),bougainvillea:mat('#c0537a'),
sandstone:mat('#d9c9a4'),paving:mat('#b3b0a6'),pavingDark:mat('#9a978d'),pavingMid:mat('#c2bfb4'),stoneFlag:mat('#a8a69c'),tuscanGrass:mat('#8a9c5a'),soilWarm:mat('#9a7b57'),
water:mat('#5f93a6'),waterLight:mat('#9ec6cf'),bronze:mat('#7d7a55'),marbleWhite:mat('#efe9dc'),
paintBlue:mat('#2f6f8f'),paintYellow:mat('#e0b64a'),paintGreen:mat('#2f6b4f'),paintWhite:mat('#f3efe4'),paintRed:mat('#a8322a')};
const streetLampBulb=mat('#737c80',{emissive:'#ffd38c',emissiveIntensity:2.6});
const streetLampDayColor=new THREE.Color('#737c80'),streetLampNightColor=new THREE.Color('#f1cc8c');
const windowNightColors=[M.warm.color.clone(),M.warmDim.color.clone()];
return {M,mat,gradient,materials,emissives,nightLights,streetLampBulb,streetLampDayColor,streetLampNightColor,windowNightColors};
}
