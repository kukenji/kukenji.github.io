import * as THREE from 'three';

// Neon Village — self-contained, authored procedural 3D scene.
// Rendering is Three.js, no GLB dependencies, no framework, no build step.
const game = document.querySelector('#game');
const loading = document.querySelector('#loading');
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', alpha:false, stencil:false, depth:true });
// Quality profiles prioritize smooth motion on Retina MacBooks.
renderer.setPixelRatio(1);
renderer.setSize(game.clientWidth, game.clientHeight);
renderer.shadowMap.enabled = false;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.45;
game.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101b35);
scene.fog = new THREE.FogExp2(0x16243c, 0.012);
const camera = new THREE.OrthographicCamera(-22, 22, 17, -17, .1, 180);
const clock = new THREE.Clock();
const C = { ground:0x22383e, road:0x24343b, slate:0x263d4b, wood:0x63504c, trim:0x0e2635, roof:0x243b53, cyan:0x55eee5, pink:0xff6ec7, amber:0xffc17d, blue:0xa6b8ff, dark:0x101b2a, white:0xd9eef2 };
const mat = (color, opts={}) => new THREE.MeshStandardMaterial({color,roughness:.8,metalness:.11,...opts});
const palette = {
  ground:mat(C.ground), road:mat(C.road,{roughness:.42,metalness:.18}), stone:mat(0x526067),
  concrete:mat(0x344855), facade:mat(0x3b4853), wood:mat(C.wood), darkwood:mat(0x302e37),
  roof:mat(C.roof,{roughness:.63,metalness:.19}), roofEdge:mat(0x172c40), metal:mat(0x516475,{roughness:.35,metalness:.7}),
  glass:mat(0x1b3a51,{roughness:.15,metalness:.63}), cyan:mat(C.cyan,{emissive:C.cyan,emissiveIntensity:4.3}),
  pink:mat(C.pink,{emissive:C.pink,emissiveIntensity:3.7}), amber:mat(C.amber,{emissive:C.amber,emissiveIntensity:2.8}),
  blue:mat(C.blue,{emissive:C.blue,emissiveIntensity:3.4}), window:mat(0xffd4a0,{emissive:0xffad57,emissiveIntensity:1.9}),
  water:mat(0x17445b,{roughness:.23,metalness:.6}), foliage:mat(0x2c555b), black:mat(0x131722)
};
const G = new THREE.Group(); scene.add(G);
// Reuse GPU geometry rather than allocating a separate box buffer for every sign, slab and window.
const sharedBoxGeometry = new THREE.BoxGeometry(1,1,1);
const box = (parent,w,h,d,x,y,z,m,shadow=true) => {const o=new THREE.Mesh(sharedBoxGeometry,m);o.scale.set(w,h,d);o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o};
// Cache primitive geometries: geometry sharing enables instancing beyond simple boxes.
const cylinderGeometries=new Map();
const sphereGeometries=new Map();
function cylinderGeometry(r1,r2,h,n){
  const key=`${r1}/${r2}/${h}/${n}`;
  if(!cylinderGeometries.has(key)) cylinderGeometries.set(key,new THREE.CylinderGeometry(r1,r2,h,n));
  return cylinderGeometries.get(key);
}
function sphereGeometry(r,w,h){
  const key=`${r}/${w}/${h}`;
  if(!sphereGeometries.has(key)) sphereGeometries.set(key,new THREE.SphereGeometry(r,w,h));
  return sphereGeometries.get(key);
}
const cyl=(parent,r1,r2,h,x,y,z,m,n=9)=>{
  const o=new THREE.Mesh(cylinderGeometry(r1,r2,h,n),m);
  o.position.set(x,y,z);o.castShadow=false;parent.add(o);return o;
};
const sphere=(parent,r,x,y,z,m,w=9,h=7)=>{
  const o=new THREE.Mesh(sphereGeometry(r,w,h),m);
  o.position.set(x,y,z);o.castShadow=false;parent.add(o);return o;
};
const lineGeometry=cylinderGeometry(1,1,1,6);
function line(parent,a,b,r,m){
  const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);
  const delta=end.clone().sub(start);
  const mesh=new THREE.Mesh(lineGeometry,m);
  mesh.position.copy(start).add(end).multiplyScalar(.5);
  mesh.scale.set(r,delta.length(),r);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  parent.add(mesh);return mesh;
}
// Dynamic lighting has a fixed GPU budget; emissive signs remain visible even with local lights off.
const managedLights=[];
function glow(parent,x,y,z,color,power=5,range=9){const l=new THREE.PointLight(color,power,range,2);l.position.set(x,y,z);parent.add(l);l.userData.baseIntensity=power;managedLights.push(l);return l}
function tex(seed,base,spots,number=1000){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=base;ctx.fillRect(0,0,256,256);let v=seed;const rand=()=>((v=(v*1664525+1013904223)>>>0)/4294967296);for(let i=0;i<number;i++){ctx.globalAlpha=.04+rand()*.14;ctx.fillStyle=spots[(rand()*spots.length)|0];const x=rand()*256,y=rand()*256,s=rand()*6+.5;ctx.fillRect(x,y,s,s*.6)}ctx.globalAlpha=.16;for(let i=0;i<10;i++){ctx.fillStyle='#9aa9ad';ctx.fillRect(rand()*256,rand()*256,rand()*35,1)}ctx.globalAlpha=1;const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4;return t}
const groundTexture=tex(13,'#364949',['#6b7e79','#142f35','#668080','#0b1c2d'],2600);groundTexture.repeat.set(8,8);palette.ground.map=groundTexture;palette.ground.color.set(0xffffff);palette.ground.needsUpdate=true;
const asphaltTexture=tex(22,'#36434a',['#53666c','#091e28','#819194'],1600);asphaltTexture.repeat.set(2,2);palette.road.map=asphaltTexture;palette.road.color.set(0xffffff);palette.road.needsUpdate=true;
const base=box(G,82,.5,84,0,-.38,1,palette.ground,false);
for(let i=0;i<30;i++){const x=-41+i*2.83;box(G,2.2,.1,1.1,x,-.06,-41, palette.metal,false)}
// Water: below street level, crossed only by the main bridge.
box(G,84,.22,5.1,0,-.12,13,palette.water,false);
const waterShimmerMaterials=[mat(0x33848b,{transparent:true,opacity:.36,emissive:0x0a4651,emissiveIntensity:.26}),mat(0x477388,{transparent:true,opacity:.36,emissive:0x0a4651,emissiveIntensity:.26})];
for(let i=0;i<35;i++){const x=-40+i*2.4;box(G,1.45,.025,.065,x,-.005,12.1+i%3*.82,i%3===0?waterShimmerMaterials[0]:waterShimmerMaterials[1],false)}
for(let edge of [10.24,15.73]){box(G,84,.26,.35,0,.07,edge,palette.stone,false);for(let i=-38;i<40;i+=3.3)box(G,1.7,.03,.065,i,.23,edge,palette.cyan,false)}
// Streets are explicitly joined rectangles, with intersection pads — no triangulated spline caps.
const roadDashMaterial=mat(0xb9c7b6,{emissive:0x28393a,emissiveIntensity:.4});
function road(x,z,w,d){box(G,w,.065,d,x,.055,z,palette.road,false);if(d>w){for(let p=z-d/2+2;p<z+d/2-1;p+=4){box(G,.10,.012,1.65,x,.096,p,roadDashMaterial,false)}}else{for(let p=x-w/2+2;p<x+w/2-1;p+=4)box(G,1.65,.012,.1,p,.096,z,roadDashMaterial,false)}}
road(0,0,64,5); road(0,29.5,63,5); road(0,-10,5,29); road(0,4.9,5,10.3);road(0,22.4,5,13.6);
for(let x of [-26,26])road(x,-.1,3,13);
function sidewalk(x,z,w,d){box(G,w,.10,d,x,.11,z,palette.concrete,false);for(let k=0;k<w;k+=2.5)box(G,.022,.014,d,x-w/2+k,.178,z,palette.metal,false)}
sidewalk(-16,4,14,1);sidewalk(16,4,14,1);sidewalk(-16,26.4,14,1);sidewalk(16,26.4,14,1);
// Central pedestrian bridge; approaches join the boulevard at both ends.
box(G,6.0,.32,6.5,0,.23,13,palette.darkwood);
for(let z=10;z<=16;z+=.52)box(G,5.85,.06,.39,0,.43,z,palette.wood);
for(let x of [-2.85,2.85]){for(let z=10;z<=16;z+=2)cyl(G,.15,.18,1.24,x,1.03,z,palette.darkwood);line(G,[x,1.43,10],[x,1.43,16],.095,palette.wood)}
for(let z of [10.1,15.9]){for(let x of [-2.3,2.3])box(G,.2,.13,.2,x,.58,z,palette.cyan)}
// Shrine mountain terrace, steps at lower front (positive Z).
box(G,17,2.3,14,0,.9,-27,palette.stone);
box(G,15,.24,12.5,0,2.18,-27,palette.concrete);
for(let i=0;i<10;i++){const z=-19.5-i*.47;box(G,4, .19+i*.215, .46,0,.1+(i*.215)/2,z,palette.wood)}
for(let side of [-1,1]){line(G,[side*2.16,.3,-19.3],[side*2.16,2.45,-24.3],.09,palette.wood)}
// Signs use on-demand canvas lettering rather than floating HTML labels.
function signTexture(text,color='#a5fff0',bg='#0d2836',fontSize=45){const c=document.createElement('canvas');c.width=512;c.height=128;const q=c.getContext('2d');q.fillStyle=bg;q.fillRect(0,0,c.width,c.height);q.strokeStyle=color;q.lineWidth=6;q.strokeRect(5,5,502,118);q.font=`700 ${fontSize}px Arial`;q.textAlign='center';q.textBaseline='middle';q.fillStyle=color;q.shadowColor=color;q.shadowBlur=13;q.fillText(text,256,66,475);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function sign(parent,text,x,y,z,color='#8ef7ef',scale=3.8){const map=signTexture(text,color);const m=new THREE.MeshBasicMaterial({map,transparent:false,side:THREE.DoubleSide});const o=new THREE.Mesh(new THREE.PlaneGeometry(scale,scale/4),m);o.position.set(x,y,z);parent.add(o);return o}
function kanjiTexture(text,color='#7efef1',ghost='#ff6ec7',bg='#08131f'){const c=document.createElement('canvas');c.width=512;c.height=512;const q=c.getContext('2d');q.fillStyle=bg;q.fillRect(0,0,512,512);q.strokeStyle=color;q.lineWidth=6;q.strokeRect(10,10,492,492);q.font='700 250px serif';q.textAlign='center';q.textBaseline='middle';q.shadowColor=color;q.shadowBlur=24;q.fillStyle=color;q.fillText(text,256,258);q.globalAlpha=.5;q.shadowBlur=14;q.fillStyle=ghost;q.fillText(text,268,248);q.globalAlpha=.18;for(let i=0;i<15;i++){q.fillStyle=i%2?color:ghost;const yy=40+i*28+((i*13)%9);q.fillRect(26,yy,460,4)}q.globalAlpha=1;const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
function glitchKanji(parent,text,x,y,z,main='#7efef1',ghost='#ff6ec7',w=3.2,h=3.2){const tex=kanjiTexture(text,main,ghost);const m1=new THREE.MeshBasicMaterial({map:tex,transparent:false,side:THREE.DoubleSide});const m2=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:.35,color:ghost,side:THREE.DoubleSide});const a=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m1);a.position.set(x,y,z);parent.add(a);const b=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m2);b.position.set(x+.12,y+.08,z-.08);parent.add(b);return [a,b]}
function facadePaintLight(x,y,z,color,intensity=2.3,range=12){return glow(scene,x,y,z,color,intensity,range)}
function holoFish(parent,x,y,z,scale=.9,color=0x7ffcf6){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);const bodyMat=mat(0xa8f9ff,{transparent:true,opacity:.52,emissive:color,emissiveIntensity:2.7,roughness:.2,metalness:.35});const finMat=mat(0xff8dd8,{transparent:true,opacity:.36,emissive:0xff8dd8,emissiveIntensity:2.2,roughness:.2,metalness:.2});const body=new THREE.Mesh(new THREE.SphereGeometry(.55,14,10),bodyMat);body.scale.set(1.5,.72,.62);g.add(body);const tail=new THREE.Mesh(new THREE.ConeGeometry(.34,.7,3),finMat);tail.rotation.z=-Math.PI/2;tail.position.set(-1.0,0,0);g.add(tail);const topFin=new THREE.Mesh(new THREE.ConeGeometry(.16,.45,3),finMat);topFin.position.set(-.05,.42,0);topFin.rotation.z=.18;g.add(topFin);const sideFinL=new THREE.Mesh(new THREE.ConeGeometry(.13,.4,3),finMat);sideFinL.position.set(.18,-.02,.24);sideFinL.rotation.x=Math.PI/2;sideFinL.rotation.z=.5;g.add(sideFinL);const sideFinR=sideFinL.clone();sideFinR.position.z=-.24;sideFinR.rotation.z=-.5;g.add(sideFinR);// Holographic materials already emit color: one light per fish would be expensive.
g.userData={baseY:y,phase:(x*1.73+z*.91)%6.28,scale};g.scale.setScalar(scale);return g}
function lantern(parent,x,y,z,accent=palette.amber){cyl(parent,.065,.065,.6,x,y+.46,z,palette.darkwood);box(parent,.46,.52,.42,x,y,z,accent);box(parent,.54,.09,.5,x,y+.28,z,palette.darkwood);box(parent,.54,.09,.5,x,y-.28,z,palette.darkwood)}
function vending(parent,x,z,accent=palette.cyan){box(parent,1.1,2, .8,x,1,z,palette.metal);box(parent,.86,1.2,.07,x,1.21,z+.44,palette.glass);for(let i=0;i<3;i++)for(let j=0;j<3;j++)box(parent,.18,.14,.075,x-.27+i*.27,1.67-j*.35,z+.49,i===1?accent:palette.blue);box(parent,.85,.15,.09,x,.46,z+.49,palette.darkwood)}
function ac(parent,x,y,z){box(parent,1,.73,.8,x,y,z,palette.metal);cyl(parent,.31,.31,.08,x,y,z+.44,palette.darkwood,12).rotation.x=Math.PI/2;sphere(parent,.10,x,y,z+.51,palette.metal)}
function windowBar(parent,x,y,z,w=1.35,h=1.4){box(parent,w,h,.11,x,y,z,palette.window);box(parent,w+.17,.09,.21,x,y+h/2,z+.02,palette.darkwood);box(parent,w+.17,.09,.21,x,y-h/2,z+.02,palette.darkwood);box(parent,.11,h,.21,x,y,z+.02,palette.darkwood);box(parent,.07,h,.22,x-.3,y,z+.04,palette.darkwood)}
function torii(parent,z,y=2.5){for(let x of [-2.2,2.2])cyl(parent,.2,.25,3,x,y+1.5,z,palette.wood);box(parent,5.7,.4,.58,0,y+3,z,palette.darkwood);box(parent,5,.23,.45,0,y+2.45,z,palette.wood)}
// Buildings are genuinely distinguishable silhouettes, each built from a shared scale convention.
const sites=[];
function architecture({id,name,x,z,w,d,h,accent,theme,baseY=0,roof=true}){
const root=new THREE.Group();root.position.set(x,baseY,z);G.add(root);
box(root,w,.45,d,0,.23,0,palette.concrete);
box(root,w-.34,h,d-.34,0,.45+h/2,0, theme==='home'?palette.wood:palette.facade);
for(let a of [-1,1])for(let b of [-1,1])box(root,.28,h+.35,.3,a*(w/2-.17),.45+h/2,b*(d/2-.16),palette.darkwood);
if(roof){const roofHeight=.45+h+.85;const rw=w/2+.7;for(let side of [-1,1]){const p=box(root,rw,.22,d+1.7,side*w/4,roofHeight-.36,0,palette.roof);p.rotation.z=-side*.29;const trim=box(root,rw,.07,d+1.8,side*w/4,roofHeight-.49,0,accent);trim.rotation.z=-side*.29;}box(root,.26,.22,d+1.9,0,roofHeight+.38,0,palette.roofEdge);for(let zt=-d/2;zt<=d/2;zt+=.8){box(root,w+.8,.10,.1,0,.45+h-.28,zt,palette.roofEdge)}}
const front=d/2+.055;
box(root,1.8,2.65,.24,0,1.75,front,palette.darkwood);box(root,.07,2.4,.30,0,1.75,front+.09,accent);
windowBar(root,-w*.28,2.35,front+.1,1.2,1.35);windowBar(root,w*.28,2.35,front+.1,1.2,1.35);
box(root,w+1,.22,1.0,0,.21,d/2+.7,palette.wood);
for(let side of [-1,1])lantern(root,side*1.35,2.35,front+.55,accent);
sites.push({id,name,x,z,doorZ:z+d/2+1.5,w,d,baseY, radius:5.2});return root;
}
function addHighriseWindows(root,w,h,d,accent,levels=5){
  const front=d/2+.12;
  const sideDepth=Math.max(1.8,d-1.2);
  for(let i=1;i<=levels;i++){
    const y=1.4+i*1.4;
    if(y>h-.45) break;
    windowBar(root,-w*.28,y,front,1.15,1.05);
    windowBar(root,w*.28,y,front,1.15,1.05);
    box(root,w-1.0,.06,.14,0,y+.74,front+.04,accent);
    box(root,.14,.95,sideDepth,-w/2-.02,y,0,accent);
    box(root,.14,.95,sideDepth,w/2+.02,y,0,accent);
  }
}
function addRooftopFrame(root,w,h,d,accent){
  box(root,w+.9,.08,.16,0,h+.42,d/2+.03,accent);
  box(root,w+.9,.08,.16,0,h+.42,-d/2-.03,accent);
  box(root,.16,.08,d+.3,-w/2-.03,h+.42,0,accent);
  box(root,.16,.08,d+.3,w/2+.03,h+.42,0,accent);
}
function skylineTower(x,z,w,d,h,glowMat,windowMat){
  const shell=mat(0x14233a,{roughness:.92,metalness:.22});
  box(G,w,h,d,x,h/2-.15,z,shell,false);
  for(let y=2;y<h-1.5;y+=1.55){
    for(let xo=-w/2+1.0;xo<=w/2-1.0;xo+=1.3){
      box(G,.72,.52,.10,x+xo,y,z+d/2+.06,windowMat,false);
    }
    box(G,w-.6,.05,.12,x,y+.48,z+d/2+.08,glowMat,false);
  }
  box(G,w+.5,.10,.18,x,h-.2,z+d/2+.12,glowMat,false);
  glow(G,x,h*.72,z+d/2-.5,glowMat===palette.pink?0xff7fd4:(glowMat===palette.blue?0xa8b8ff:0x55eee5),3.2,18);
}
// Engineering workshop — asymmetric industrial roof and utility facade.
const workshop=architecture({id:'projects',name:'THE WORKSHOP',x:-17,z:-5,w:10.5,d:8.8,h:9.2,accent:palette.cyan,theme:'workshop'});
addHighriseWindows(workshop,10.5,9.2,8.8,palette.cyan,5);addRooftopFrame(workshop,10.5,9.2,8.8,palette.cyan);
box(workshop,2.3,5.8,.55,3.1,3.45,4.57,palette.metal);for(let j=0;j<8;j++)box(workshop,1.9,.1,.10,3.1,1.1+j*.7,4.88,palette.darkwood);
box(workshop,3.8,.34,1.15,-2.1,10.0,-1.8,palette.metal);ac(workshop,3.9,10.1,1.1);cyl(workshop,.18,.24,3.2,2.9,10.8,-2.4,palette.metal);
sign(workshop,'BUILD / LAB',0,8.6,4.62,'#7affee',4.5);sign(workshop,'PROJECTS',0,6.95,4.63,'#57f6ff',3.5);
box(workshop,5.6,.18,.12,0,8.05,4.62,palette.cyan);vending(G,-23,1.8,palette.cyan);glitchKanji(workshop,'電',-4.1,7.2,4.68,'#75fff0','#ff76d8',2.4,2.4);glitchKanji(workshop,'技',4.0,6.0,4.68,'#90f8ff','#a6b8ff',2.0,2.0);facadePaintLight(-20.2,5.2,-0.8,0x42efe2,2.6,13);facadePaintLight(-13.2,5.4,-1.0,0xff7fd7,1.8,10);vending(G,-23,1.8,palette.cyan);glow(G,-17,6.8,0.7,0x40eadc,4.5,14);glow(G,-17,9.8,-1.2,0x40eadc,3.3,13);
// Home — layered wooden porch, warm shoji panels and delicate roof trim.
const home=architecture({id:'about',name:"KENJI'S HOME",x:17,z:-5,w:9.4,d:8.9,h:7.6,accent:palette.amber,theme:'home'});
addHighriseWindows(home,9.4,7.6,8.9,palette.amber,4);addRooftopFrame(home,9.4,7.6,8.9,palette.amber);
for(let x of [-3.4,-2.6,-1.8,1.8,2.6,3.4])box(home,.10,4.4,.12,x,3.5,4.58,palette.darkwood);
for(let x of [-3.8,3.8])lantern(home,x,5.45,5.3,palette.amber);
box(home,10.4,.21,2.3,0,.5,5.15,palette.wood);sign(home,'KENJI / HOME',0,6.95,4.62,'#ffd1a0',3.7);ac(home,3.9,8.0,-1.8);
box(home,5.0,.16,.12,0,6.25,4.62,palette.amber);glitchKanji(home,'灯',-3.8,6.4,4.68,'#ffd6a1','#ff9bd8',2.0,2.0);facadePaintLight(14.4,4.8,-0.6,0xffc072,2.3,12);facadePaintLight(19.4,5.3,-0.8,0x5ff4e8,1.6,9);glow(G,17,5.3,.6,0xffab60,4.0,12);glow(G,17,7.8,-1.4,0xffca74,2.9,12);
// Train depot — an elongated canopy, platform, tracks and departure display.
const depot=architecture({id:'experience',name:'CYBER RAIL DEPOT',x:-17,z:24,w:12.6,d:6.2,h:6.4,accent:palette.blue,theme:'depot',roof:false});
addHighriseWindows(depot,12.6,6.4,6.2,palette.blue,3);addRooftopFrame(depot,12.6,6.4,6.2,palette.blue);
box(depot,14.8,.35,9.8,0,7.1,.7,palette.roof);for(let x of [-6.3,6.3])for(let z of [-3.4,3.8])box(depot,.25,6.8,.25,x,3.4,z,palette.metal);
for(let z of [2,4,6,8])box(depot,14.8,.07,.13,0,.39,z,palette.amber);
sign(depot,'NIGHT LINE 01',0,5.6,3.35,'#c0caff',4.5);sign(depot,'RAIL DEPOT',0,4.2,3.36,'#a8c5ff',3.7);
for(let x=-28;x<-6;x+=3)for(let z of [35,37])box(G,2.4,.13,.2,x,.14,z,palette.darkwood);
for(let z of [35,37])box(G,27,.17,.13,-17,.24,z,palette.metal);
box(depot,3.4,3.9,.4,-4.3,3.05,3.42,palette.glass);glitchKanji(depot,'駅',4.7,5.4,3.48,'#b7c7ff','#74fff0',2.3,2.3);facadePaintLight(-21.0,4.5,27.6,0x8ca6ff,2.4,12);facadePaintLight(-13.0,5.2,27.7,0x59f6e8,1.7,10);glow(G,-17,6.8,29,0x8498ff,4.0,15);glow(G,-17,4.1,28.2,0xa7b4ff,2.8,12);
// Post office — vertical communications tower and parcel lockers.
const post=architecture({id:'contact',name:'NEON POST OFFICE',x:17,z:24,w:10.2,d:7.2,h:8.4,accent:palette.pink,theme:'post'});
addHighriseWindows(post,10.2,8.4,7.2,palette.pink,5);addRooftopFrame(post,10.2,8.4,7.2,palette.pink);
for(let i=0;i<4;i++)for(let j=0;j<5;j++)box(post,.85,.7,.35,3.2-i*1.0,1.15+j*.85,3.85,i===2&&j===2?palette.pink:palette.metal);
box(post,2.0,4.8,1.0,-3.8,7.5,-1.4,palette.metal);line(post,[-3.8,10.2,-1.4],[-3.8,12.6,-1.4],.07,palette.cyan);sphere(post,.42,-3.8,12.6,-1.4,palette.pink);
sign(post,'POST / CONNECT',0,7.2,3.78,'#fface0',4.2);sign(post,'CONTACT',0,5.8,3.79,'#ff86d8',3.5);vending(G,23,29.0,palette.pink);
glitchKanji(post,'信',-3.9,8.9,3.86,'#ffb0e4','#7bfdf2',2.3,2.3);glitchKanji(post,'郵',3.8,6.7,3.86,'#ff89da','#ffc1e8',2.1,2.1);facadePaintLight(13.4,6.0,27.4,0xff70cf,2.7,13);facadePaintLight(20.4,5.3,27.1,0x5cf7eb,1.8,10);glow(G,17,7.0,28.0,0xff79ca,4.3,15);glow(G,17,10.4,23.6,0xffa6dd,2.7,13);
// Shrine on the elevated platform.
const shrine=architecture({id:'awards',name:'HILLTOP SHRINE',x:0,z:-28,w:9,d:6,h:3.5,baseY:2.3,accent:palette.amber,theme:'home'});
torii(G,-22.8,.3);for(let x of [-5.7,5.7])lantern(G,x,3.1,-24,palette.amber);sign(shrine,'SHRINE / WINS',0,3.5,3.17,'#ffdda1',3.4);glow(G,0,5.4,-24,0xffb47c,3.1,13);
// === NEON VILLAGE // SKYLINE V2: bespoke facades + rooftop AR directory ===
// No new collision footprints. Architecture remains inside the original landmarks.
const cyberSites=[];
const cyberColors={projects:0x49fff1,about:0xffbd80,experience:0xa6b8ff,contact:0xff70d7,awards:0xffcf86};
function holoTitle(label,secondary,hex){
  const c=document.createElement('canvas');c.width=1024;c.height=256;
  const q=c.getContext('2d');q.clearRect(0,0,1024,256);
  q.fillStyle='rgba(7,20,36,.80)';q.fillRect(17,14,990,222);
  q.strokeStyle=hex;q.lineWidth=8;q.strokeRect(18,16,988,220);
  q.fillStyle=hex;q.shadowColor=hex;q.shadowBlur=23;
  q.textAlign='center';q.font='800 96px Arial, sans-serif';q.fillText(label,512,129,925);
  q.shadowBlur=0;q.font='600 32px monospace';q.fillStyle='#dcffff';q.fillText(secondary,512,190,925);
  q.fillStyle=hex;for(let i=0;i<14;i++)q.fillRect(40+i*69,215,33,3);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  return t;
}
function rooftopHolo(root,label,secondary,roofY,width,color,hex){
  const assembly=new THREE.Group();root.add(assembly);
  const pole=mat(0x28384a,{metalness:.75,roughness:.35});
  for(let x of [-width*.35,width*.35])box(assembly,.12,1.45,.12,x,roofY+.72,0,pole);
  const frame=mat(color,{emissive:color,emissiveIntensity:2.4,transparent:true,opacity:.67,depthWrite:false});
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(width,2),new THREE.MeshBasicMaterial({map:holoTitle(label,secondary,hex),side:THREE.DoubleSide,transparent:true,opacity:.95,depthWrite:false}));
  screen.position.set(0,roofY+2.2,.10);screen.renderOrder=5;assembly.add(screen);
  box(assembly,width+.16,.045,.10,0,roofY+3.22,.06,frame,false);
  box(assembly,width+.16,.045,.10,0,roofY+1.17,.06,frame,false);
  for(let x of [-width/2-.08,width/2+.08])box(assembly,.045,2.06,.10,x,roofY+2.2,.06,frame,false);
  const ghost=screen.clone();ghost.material=screen.material.clone();ghost.material.opacity=.16;ghost.position.z=-.19;assembly.add(ghost);
  return {screen,ghost,frame,root:assembly};
}
function sculptBuilding(id,root,w,d,h,roofY,label,secondary,hex,accent,kind){
  const front=d/2+.26;
  const detail=new THREE.Group();root.add(detail);
  const alloy=mat(0x152b3c,{metalness:.65,roughness:.46});
  const panel=mat(0x273c50,{metalness:.48,roughness:.65});
  const neon=mat(accent,{emissive:accent,emissiveIntensity:2.2,roughness:.25,metalness:.24});
  // Architectural rhythm: separated floor slabs, deep pilasters, fins, and double-height entrances.
  for(let y=3.5;y<h+.4;y+=2.75){
    box(detail,w+.45,.25,d+.38,0,y,0,alloy);
    box(detail,w+.12,.07,.18,0,y+.16,front,neon,false);
  }
  for(let x of [-w/2+.63,w/2-.63]){
    box(detail,.46,h+.5,.65,x,(h+.5)/2,.02,panel);
    box(detail,.08,h+.2,.16,x,(h+.5)/2,front+.05,neon,false);
  }
  box(detail,w*.55,.30,1.9,0,3.0,d/2+.85,alloy);
  box(detail,w*.55+.2,.055,1.95,0,3.19,d/2+.85,neon,false);
  for(let x of [-1.55,1.55])box(detail,.18,2.6,.25,x,1.45,front+.14,alloy);
  // Each district landmark gets a different silhouette and engineering language.
  if(kind==='lab'){
    for(let x of [-3.5,-1.7,.1,1.9]){
      box(detail,.32,h-3.4,.8,x,(h+3.4)/2,-d/2+.35,alloy);
      box(detail,.1,h-3.7,.3,x,(h+3.7)/2,-d/2+.94,neon,false);
    }
    cyl(detail,.7,.8,1.5,-w*.26,roofY+1.0,-d*.24,palette.metal,12);
    cyl(detail,.57,.57,.12,-w*.26,roofY+1.85,-d*.24,palette.cyan,12);
  }else if(kind==='residence'){
    for(let y of [3.7,6.45]){
      box(detail,w*.70,.20,1.05,0,y,front+.38,palette.wood);
      for(let x of [-w*.30,w*.30])box(detail,.15,1.1,.15,x,y+.55,front+.4,palette.darkwood);
    }
    for(let x of [-3.25,3.25])lantern(detail,x,4.4,front+.45,palette.amber);
  }else if(kind==='station'){
    box(detail,w+1.2,.28,2.4,0,3.55,front+.85,palette.metal);
    for(let x=-w/2+1.2;x<w/2;x+=2.3){
      box(detail,.12,3.2,.12,x,1.85,front+1.85,palette.metal);
      box(detail,.13,.06,1.6,x,3.7,front+.85,neon,false);
    }
    box(detail,w*.75,.95,.14,0,4.6,front+.18,palette.glass);
  }else if(kind==='courier'){
    for(let x of [-w*.34,w*.34]){
      box(detail,1.1,h-3,.5,x,(h+3)/2,front+.28,palette.metal);
      for(let y=4.2;y<h-.8;y+=1.25)box(detail,.9,.10,.56,x,y,front+.30,neon,false);
    }
    for(let i=0;i<3;i++)box(detail,1.1,.6,.5,-1.4+i*1.3,1.15,front+.32,palette.metal);
  }else if(kind==='shrine'){
    for(let x of [-w*.38,w*.38]){
      box(detail,.23,2.8,.29,x,2.8,front+.36,palette.wood);
      lantern(detail,x,4.5,front+.72,palette.amber);
    }
    box(detail,w+1,.18,1.1,0,h+.60,front-.6,palette.wood);
  }
  const holo=rooftopHolo(root,label,secondary,roofY,Math.min(w+1.6,13.5),accent,hex);
  // Hacking operates only on this site's independent neon materials, not global shared ones.
  const allNeon=[neon, holo.frame];
  const hackLight=new THREE.PointLight(accent,0,15,2);
  hackLight.position.set(0,Math.min(h+2,10),d/2+1);hackLight.visible=false;root.add(hackLight);
  cyberSites.push({id,root,detail,holo,allNeon,hackLight,accent,roofY,
    originalIntensity:allNeon.map(m=>m.emissiveIntensity),hackedUntil:0,started:0});
}
sculptBuilding('projects',workshop,10.5,8.8,9.2,10.85,'PROJECTS','ENGINEERING // BUILD', '#5efff2',0x52fff1,'lab');
sculptBuilding('about',home,9.4,8.9,7.6,9.25,'ABOUT','ORIGINS // KENJI KU','#ffca8b',0xffb879,'residence');
sculptBuilding('experience',depot,12.6,6.2,6.4,7.45,'EXPERIENCE','QUALCOMM // CEREBRAS','#acbaff',0xabbaff,'station');
sculptBuilding('contact',post,10.2,7.2,8.4,10.05,'CONTACT','CONNECT // SAY HELLO','#ff8edf',0xff77d8,'courier');
sculptBuilding('awards',shrine,9,6,3.5,7.45,'AWARDS','HONORS // MILESTONES','#ffd18d',0xffcd89,'shrine');

// Coherent street infrastructure (not arbitrary floating blocks).
function lightpost(x,z,pink=false){const m=pink?palette.pink:palette.cyan;cyl(G,.12,.19,4.3,x,2.17,z,palette.metal);line(G,[x,4.3,z],[x+1,4.3,z],.09,palette.metal);box(G,1.2,.14,.30,x+1,4.22,z,m);}
for(let p of [[-28,7],[28,7],[-28,20],[28,20],[-7,6],[7,20],[-7,-15],[7,-15]])lightpost(p[0],p[1],p[0]>0);
for(let p of [[-30,-15],[30,-15],[-30,33],[30,33]]){cyl(G,.25,.34,5.6,p[0],2.8,p[1],palette.metal);box(G,1.2,.7,.9,p[0],5.45,p[1],palette.metal)}
for(let z of [-12,4,30]){line(G,[-30,5.8,z],[30,5.8,z],.022,palette.darkwood);line(G,[-30,6.2,z],[30,6.2,z],.018,palette.metal)}
function planter(x,z){box(G,1.4,.6,1.4,x,.35,z,palette.darkwood);cyl(G,.44,.57,.6,x,.92,z,palette.foliage,7);sphere(G,.63,x,1.35,z,palette.foliage)}
for(let [x,z] of [[-26,-14],[26,-14],[-26,23],[26,23],[-8,30],[8,30]])planter(x,z);
// Dense cyberpunk skyline around the district to push the world toward a true neon city.
skylineTower(-33,-4,7.2,7.2,18,palette.cyan,palette.window);
skylineTower(33,-4,7.2,7.2,17,palette.pink,palette.window);
skylineTower(-32,25,7.8,7.5,19,palette.blue,palette.window);
skylineTower(32,25,8.0,7.7,20,palette.pink,palette.window);
skylineTower(-6,-36,7.2,6.6,16,palette.cyan,palette.window);
skylineTower(8,-36,7.8,6.9,18,palette.blue,palette.window);
for(let x of [-17,17]){sign(G,'NOVA',x,10.8,-11.5,x<0?'#7affee':'#ff9bde',4.6);glow(G,x,9.8,-10.8,x<0?0x45f7e5:0xff7fd2,3.0,16);}
for(let z of [7,20]){box(G,58,.06,.15,0,.22,z,palette.cyan,false);glow(G,0,.7,z,0x4ef2e6,1.4,24);}
for(let x of [-2.6,2.6]){box(G,.18,.10,6.2,x,.62,13,palette.pink,false);glow(G,x,.9,13,0xff80d7,1.7,10);}
const hologramFish=[
  holoFish(G,-4.6,1.9,11.6,.95,0x7ffcf6),
  holoFish(G,-1.4,2.5,13.5,.82,0x76ecff),
  holoFish(G,2.2,2.1,14.7,1.05,0x89fff0),
  holoFish(G,5.1,2.7,12.0,.88,0xff9fe1),
  holoFish(G,12.5,4.8,20.0,.72,0x79fff3),
  holoFish(G,-11.8,4.4,2.5,.68,0xa9b8ff)
];
// Weather particles, limited and batched into one BufferGeometry.
const rainCount=360;const rainPositions=new Float32Array(rainCount*6);let rs=29;const random=()=>((rs=(rs*1664525+1013904223)>>>0)/4294967296);
for(let i=0;i<rainCount;i++){const x=(random()-.5)*80,z=(random()-.5)*81+1,y=random()*24+1;rainPositions.set([x,y,z,x-.17,y-.75,z+.11],i*6)}
const rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));const rain=new THREE.LineSegments(rainGeometry,new THREE.LineBasicMaterial({color:0x9dc7ed,transparent:true,opacity:.20,depthWrite:false}));G.add(rain);
const ambient=new THREE.HemisphereLight(0x9cb6e6,0x1b292e,2.4);scene.add(ambient);
const moon=new THREE.DirectionalLight(0xbbd8ff,3.7);moon.position.set(-15,37,22);moon.castShadow=true;moon.shadow.mapSize.set(1024,1024);moon.shadow.camera.left=-45;moon.shadow.camera.right=45;moon.shadow.camera.top=45;moon.shadow.camera.bottom=-45;moon.shadow.normalBias=.025;scene.add(moon);
glow(scene,-14,8,4,0x43f0e8,2.4,34);
glow(scene,16,8,24,0xff76d1,2.2,34);
glow(scene,-17,7,24,0xa3b7ff,1.7,30);
// Batch *all* stationary meshes that share geometry and material, including
// non-box props (pipes, railings, lantern hardware), while preserving the
// animation hierarchy of holographic fish and cyberdeck controls.
function batchStaticArchitecture(){
  G.updateMatrixWorld(true);
  const fishRoots=new Set(hologramFish);
  const batches=new Map();
  let candidates=0,merged=0;
  G.traverse(o=>{
    if(!o.isMesh || !o.geometry || !o.material || Array.isArray(o.material))return;
    if(o.isSkinnedMesh || o.isInstancedMesh)return;
    // Fish have animated parents; their transforms must remain independent.
    for(let p=o.parent;p;p=p.parent){if(fishRoots.has(p))return;}
    if(o.material.transparent) return; // retain correct hologram layering
    const key=`${o.geometry.id}:${o.material.id}:${Number(o.material.side)}`;
    if(!batches.has(key))batches.set(key,{geometry:o.geometry,material:o.material,items:[]});
    batches.get(key).items.push(o);candidates++;
  });
  for(const b of batches.values()){
    if(b.items.length<2)continue;
    const mesh=new THREE.InstancedMesh(b.geometry,b.material,b.items.length);
    mesh.castShadow=false;mesh.receiveShadow=false;
    mesh.frustumCulled=false; // one city-wide batch spans multiple landmarks
    for(let i=0;i<b.items.length;i++){
      mesh.setMatrixAt(i,b.items[i].matrixWorld);
      b.items[i].parent.remove(b.items[i]);merged++;
    }
    mesh.instanceMatrix.needsUpdate=true;
    G.add(mesh);
  }
  return {candidates,merged,batches:batches.size};
}
const optimizedMeshCount=batchStaticArchitecture();
// Handcrafted soft-toon explorer. Forward is +Z, matching movement and the game camera.
const player=new THREE.Group();G.add(player);
const body=new THREE.Group();player.add(body);
const skin=mat(0xe8b58f,{roughness:1});
const hair=mat(0x202232,{roughness:1});
const hairLight=mat(0x333246,{roughness:1});
const jacket=mat(0x315a74,{roughness:.97});
const jacketDark=mat(0x20394d,{roughness:1});
const lining=mat(0xe4bca1,{roughness:1});
const shirt=mat(0xe5ddd0,{roughness:1});
const pants=mat(0x293146,{roughness:1});
const shoe=mat(0xe5d5be,{roughness:1});
const eye=mat(0x20222c,{roughness:1});
const blush=mat(0xd78680,{roughness:1});
function orb(parent,rx,ry,rz,x,y,z,material){
  const o=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),material);
  o.scale.set(rx,ry,rz);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;
}
// Compact rounded silhouette and an oversized expressive head, not square robotic parts.
orb(body,.38,.50,.27,0,1.43,0,jacket);
orb(body,.29,.39,.18,0,1.45,.20,shirt);
orb(body,.10,.36,.075,-.235,1.40,.262,jacketDark);
orb(body,.10,.36,.075,.235,1.40,.262,jacketDark);
orb(body,.19,.15,.16,0,1.93,0,skin);
// Head, cheeks, eyes, eyebrows, nose and smile all face toward +Z.
orb(body,.405,.43,.375,0,2.23,.018,skin);
for(const side of [-1,1]){
  orb(body,.105,.065,.038,side*.22,2.17,.348,blush);
  orb(body,.049,.070,.025,side*.145,2.275,.373,eye);
  orb(body,.065,.028,.026,side*.145,2.365,.365,hair);
  orb(body,.025,.018,.027,side*.132,2.296,.395,shirt);
}
orb(body,.046,.032,.035,0,2.19,.390,skin);
const smile=new THREE.Mesh(new THREE.TorusGeometry(.105,.012,5,20,Math.PI),eye);
smile.rotation.z=Math.PI;smile.position.set(0,2.105,.378);body.add(smile);
// Sculpted hair cap and layered side-swept fringe.
orb(body,.413,.213,.375,0,2.52,-.025,hair);
orb(body,.24,.115,.16,-.18,2.47,.25,hair);
orb(body,.16,.085,.12,.075,2.50,.305,hair);
orb(body,.12,.19,.19,-.34,2.39,-.02,hair);
orb(body,.12,.17,.17,.34,2.39,-.025,hair);
orb(body,.22,.08,.18,.07,2.68,-.10,hairLight);
// Arms and legs pivot at joints so walking reads as a human gait.
const characterArms=[];const characterLegs=[];
for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.42,1.77,0);body.add(arm);characterArms.push(arm);
  orb(arm,.15,.34,.16,side*.04,-.30,0,jacket);
  orb(arm,.115,.13,.12,side*.05,-.63,.005,skin);
  orb(arm,.16,.09,.17,side*.04,-.49,0,jacketDark);
  const leg=new THREE.Group();leg.position.set(side*.17,1.08,0);body.add(leg);characterLegs.push(leg);
  orb(leg,.155,.43,.17,0,-.42,0,pants);
  orb(leg,.18,.12,.255,0,-.94,.095,shoe);
  orb(leg,.15,.035,.14,0,-.90,.245,jacketDark);
}
// Small cross-body satchel, restrained cyberpunk details.
const strap=box(body,.055,.72,.045,0,1.50,.296,lining,false);strap.rotation.z=.54;
orb(body,.20,.25,.13,.34,1.18,-.17,jacketDark);
orb(body,.085,.045,.025,.34,1.24,-.035,palette.cyan);
// Futuristic ride, mounted via B while close to the initial player spawn.
const bike=new THREE.Group();G.add(bike);bike.position.set(3.5,.1,5.0);
const bikeBody=new THREE.Group();bike.add(bikeBody);
box(bikeBody,.8,.38,1.65,0,.75,0,palette.darkwood);box(bikeBody,.75,.28,.85,0,.99,-.3,palette.metal);box(bikeBody,.8,.12,1,0,1.06,.3,palette.cyan);
for(let z of [-.9,.9]){const wheel=new THREE.Mesh(new THREE.TorusGeometry(.48,.12,8,15),palette.black);wheel.position.set(0,.47,z);wheel.rotation.y=Math.PI/2;bikeBody.add(wheel);cyl(bikeBody,.2,.2,.17,0,.47,z,palette.metal)}
line(bikeBody,[-.5,1.3,-.66],[.5,1.3,-.66],.055,palette.metal);box(bikeBody,.48,.2,.13,0,.82,1.04,palette.pink);
const placeData={
 projects:{index:'01',symbol:'⌘',title:'THE WORKSHOP',subtitle:'Where experiments turn into working software.',html:`<h3>SELECTED PROJECTS</h3><p><b>GIS Route Engine.</b> A C++ street-network routing engine using A* and Dijkstra to find efficient paths across city-scale maps.</p><p><b>Memory Allocator.</b> A custom C allocator exploring heap management, allocation, resizing, and memory alignment.</p><p><b>SageAI.</b> An AI healthcare hackathon project recognized for its work in healthcare innovation.</p>`,links:[['VIEW PORTFOLIO','index.html#projects'],['SAGEAI PROJECT','https://devpost.com/software/sageai'],['GITHUB','https://github.com/kukenji']]},
 about:{index:'02',symbol:'⌂',title:"KENJI'S HOME",subtitle:'A little introduction, behind the code.',html:`<p>Hi, I'm <b>Kenji Ku</b>, a software engineer based in Toronto and a Computer Engineering graduate of the University of Toronto.</p><p>I enjoy understanding what happens under the hood — performance, infrastructure, debugging, and building tools that make complex systems more reliable.</p><h3>WHAT I LIKE WORKING WITH</h3><p>C++, Python, C, Linux, low-level systems, and everything in between.</p>`,links:[['READ MORE','index.html#about'],['LINKEDIN','https://www.linkedin.com/in/kenji-ku/']]},
 experience:{index:'03',symbol:'⌁',title:'CYBER RAIL DEPOT',subtitle:'Every stop has taught me something new.',html:`<h3>THE JOURNEY SO FAR</h3><p><b>Qualcomm · Software Engineer (2026–present)</b><br>Building simulation and Python automation for data-center hardware and firmware integration workflows.</p><p><b>Cerebras Systems · ML Software Engineer Intern (2025)</b><br>Worked on C++ debugging software and automated log processing for AI hardware investigations.</p><p><b>Qualcomm · Software Engineer Intern (2024–2025)</b><br>Contributed to automotive systems engineering.</p>`,links:[['FULL TIMELINE','index.html#experience'],['LINKEDIN','https://www.linkedin.com/in/kenji-ku/']]},
 contact:{index:'04',symbol:'✉',title:'NEON POST OFFICE',subtitle:'Good ideas deserve to be shared.',html:`<p>Thanks for exploring my little district. I'm always interested in meeting other engineers, exchanging ideas, and learning about challenging problems worth solving.</p><h3>DROP A MESSAGE</h3><p>The post office is open all night. Send an email, connect on LinkedIn, or explore my GitHub.</p>`,links:[['EMAIL KENJI','mailto:kenji270403@gmail.com'],['LINKEDIN','https://www.linkedin.com/in/kenji-ku/'],['GITHUB','https://github.com/kukenji']]},
 awards:{index:'05',symbol:'✦',title:'HILLTOP SHRINE',subtitle:'Small milestones, remembered along the way.',html:`<h3>MILESTONES</h3><p><b>University of Toronto.</b> BASc Computer Engineering with Honours.</p><p><b>Dean's Honour List.</b> Academic recognition during undergraduate studies.</p><p><b>SageAI.</b> Best AI in Healthcare recognition at GenAI Genesis.</p><p>Each award is a reminder to keep building, stay curious, and enjoy the process.</p>`,links:[['SAGEAI ON DEVPOST','https://devpost.com/software/sageai'],['ABOUT ME','index.html#about']]}
};
const positions={projects:[-17,0.2,1.5],about:[17,.2,1.5],experience:[-17,.2,29.3],contact:[17,.2,29.3],awards:[0,2.5,-22.3]};
const modal=document.querySelector('#detail');let priorFocus=null;
function showDetail(id){const d=placeData[id];if(!d)return;priorFocus=document.activeElement;document.querySelector('#detailKicker').textContent=`${d.index} / NEON VILLAGE`;document.querySelector('#detailSymbol').textContent=d.symbol;document.querySelector('#detailTitle').textContent=d.title;document.querySelector('#detailSubtitle').textContent=d.subtitle;document.querySelector('#detailContent').innerHTML=d.html;const links=document.querySelector('#detailLinks');links.replaceChildren();for(const [title,url] of d.links){const a=document.createElement('a');a.textContent=`${title} ↗`;a.href=url;if(url.startsWith('https:')){a.target='_blank';a.rel='noopener noreferrer'}links.appendChild(a)}modal.hidden=false;document.querySelector('#detailClose').focus()}
function closeDetail(){modal.hidden=true;if(priorFocus?.focus)priorFocus.focus()}
document.querySelector('#detailClose').addEventListener('click',closeDetail);document.querySelector('#detailDone').addEventListener('click',closeDetail);modal.addEventListener('click',e=>{if(e.target===modal)closeDetail()});
document.querySelectorAll('[data-place]').forEach(b=>b.addEventListener('click',()=>showDetail(b.dataset.place)));
const keyHeld=new Set();let mounted=false;let rainEnabled=true;let audioContext=null;let audioNodes=null;let toastUntil=0;let nearest=null;
function toast(message){const t=document.querySelector('#toast');t.textContent=message;t.classList.add('visible');toastUntil=performance.now()+2500}
function interact(){if(!modal.hidden)return;if(nearest)showDetail(nearest.id);else toast('WALK CLOSER TO A LANDMARK TO INTERACT')}
function mount(){if(!modal.hidden)return;const distance=player.position.distanceTo(bike.position);if(mounted){mounted=false;bike.position.set(player.position.x+1.2,.1,player.position.z+1.1);body.visible=true;toast('DISMOUNTED · EXPLORE ON FOOT')}else if(distance<4.5){mounted=true;body.visible=true;toast('MOTORCYCLE READY · PRESS B TO DISMOUNT')}else toast('FIND THE MOTORCYCLE NEAR THE CENTRAL CROSSING')}
// === Cyberdeck ability: local light network takeover. H near an interactive building. ===
let hackCooldownUntil=0;
const hackRing=new THREE.Mesh(new THREE.RingGeometry(.94,1.05,48),new THREE.MeshBasicMaterial({color:0x64fff0,side:THREE.DoubleSide,transparent:true,opacity:0,depthWrite:false}));
hackRing.rotation.x=-Math.PI/2;hackRing.visible=false;G.add(hackRing);
let hackWaveStart=-100;
const hackStatus=document.querySelector('#hackStatus');
let lastCyberStatus='';
const hackHint=document.querySelector('#hackHint');
function hackTarget(){
  let nearestSite=null,best=Infinity;
  for(const s of sites){const distance=Math.hypot(player.position.x-s.x,player.position.z-s.doorZ);if(distance<best){best=distance;nearestSite=s}}
  return best<14?cyberSites.find(s=>s.id===nearestSite.id):null;
}
function activateHack(){
  if(!modal.hidden)return;
  const now=performance.now()/1000;
  if(now<hackCooldownUntil){toast(`CYBERDECK RECHARGING · ${Math.ceil(hackCooldownUntil-now)}s`);return}
  const site=hackTarget();if(!site){toast('NO LIGHT NETWORK IN RANGE · APPROACH A BUILDING');return}
  if(site.started>0&&now<site.hackedUntil){toast('NETWORK ALREADY OVERRIDDEN');return}
  site.started=now;site.hackedUntil=now+9;hackCooldownUntil=now+12;
  hackWaveStart=now;hackRing.visible=true;
  hackRing.position.set(player.position.x,.28,player.position.z);
  toast(`BREACH SUCCESSFUL · ${site.id.toUpperCase()} LIGHT GRID HIJACKED`);
}
function updateCyberdeck(now){
  const active=cyberSites.filter(s=>now<s.hackedUntil&&s.started>0);
  for(const s of cyberSites){
    const on=active.includes(s), age=now-s.started;
    const flicker=on&&(age<1.9)?(Math.sin(age*74)>-.06?1:.04):1;
    const pulse=on?(1.5+.6*Math.sin(age*13))*flicker:1;
    s.allNeon.forEach((m,i)=>m.emissiveIntensity=s.originalIntensity[i]*pulse);
    s.hackLight.visible=on&&localLightBudget>0;s.hackLight.intensity=on?7.2*flicker:0;
    s.holo.screen.material.opacity=on?(flicker>.1?.98:.08):.95;
    s.holo.ghost.material.opacity=on?.40:.16;
    s.holo.ghost.position.x=on?Math.sin(age*47)*.19:0;
    if(on){s.holo.screen.position.x=Math.sin(age*31)*.065;}else{s.holo.screen.position.x=0;}
  }
  const target=hackTarget();const remain=Math.max(0,Math.ceil(hackCooldownUntil-now));
  if(hackStatus){const nextStatus=remain?`CYBERDECK · ${remain}s RECHARGE`:(target?`CYBERDECK READY · ${target.id.toUpperCase()}`:'CYBERDECK · FIND A NETWORK');if(nextStatus!==lastCyberStatus){hackStatus.textContent=nextStatus;lastCyberStatus=nextStatus;}hackStatus.classList.toggle('on',active.length>0)}
  if(hackHint)hackHint.hidden=!target||!modal.hidden||remain>0;
  if(hackRing.visible){const t=now-hackWaveStart;if(t>1.15){hackRing.visible=false}else{const f=1+t*13;hackRing.scale.set(f,f,f);hackRing.material.opacity=(1-t/1.15)*.8;}}
}
window.addEventListener('keydown',e=>{if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','KeyE','KeyB','KeyH','Escape','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){if(e.target.closest('input,textarea'))return;e.preventDefault()}if(e.code==='Escape'){closeDetail();return}if(e.repeat)return;keyHeld.add(e.code);if(e.code==='KeyE')interact();if(e.code==='KeyB')mount();if(e.code==='KeyH')activateHack()});
window.addEventListener('keyup',e=>keyHeld.delete(e.code));window.addEventListener('blur',()=>keyHeld.clear());
document.querySelectorAll('[data-key]').forEach(b=>{const key=b.dataset.key;const press=e=>{e.preventDefault();keyHeld.add(key)};const release=e=>{e.preventDefault();keyHeld.delete(key)};b.addEventListener('pointerdown',press);b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('pointerleave',release)});
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>b.dataset.action==='interact'?interact():b.dataset.action==='hack'?activateHack():mount()));
document.querySelector('#interactHint').addEventListener('click',interact);
document.querySelector('#rainToggle').addEventListener('click',()=>{rainEnabled=!rainEnabled;rain.visible=rainEnabled&&qualityRainEnabled;document.querySelector('#rainToggle').textContent=qualityRainEnabled?`☂ RAIN ${rainEnabled?'ON':'OFF'}`:'☂ RAIN · ECO OFF';document.querySelector('#rainToggle').setAttribute('aria-pressed',rainEnabled)});
function audioToggle(){const btn=document.querySelector('#soundToggle');if(audioNodes){audioNodes.forEach(n=>{try{n.stop?.();n.disconnect?.()}catch{}});audioContext?.close();audioContext=null;audioNodes=null;btn.textContent='♫ AMBIENCE OFF';btn.setAttribute('aria-pressed','false');return}try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('Audio unavailable');audioContext=new AC();const gain=audioContext.createGain();gain.gain.value=.016;gain.connect(audioContext.destination);audioNodes=[];for(const hz of [55,82.41,110]){const osc=audioContext.createOscillator();osc.type='sine';osc.frequency.value=hz;osc.connect(gain);osc.start();audioNodes.push(osc)}btn.textContent='♫ AMBIENCE ON';btn.setAttribute('aria-pressed','true')}catch{toast('YOUR BROWSER COULD NOT START AUDIO')}}
document.querySelector('#soundToggle').addEventListener('click',audioToggle);
function terrainHeight(x,z){if(Math.abs(x)<7.1&&z<=-24.2)return 2.3;if(Math.abs(x)<2&&z<-19.25&&z>-24.2)return Math.min(2.3,Math.max(0,(-z-19.25)/4.95*2.3));if(Math.abs(x)<2.8&&z>10&&z<16)return .47;return .12}
function blocked(x,z){if(Math.abs(x)>39||z<-39||z>41)return true;if(z>10.4&&z<15.5&&Math.abs(x)>2.7)return true;if(z<-20&&z>-34&&Math.abs(x)<8.7&&!(Math.abs(x)<2&&z>-24.4))return true;for(const s of sites){if(s.id==='awards')continue;if(Math.abs(x-s.x)<s.w/2+.48&&Math.abs(z-s.z)<s.d/2+.47)return true}return false}
player.position.set(0,.12,4.6);
const look=new THREE.Vector3(0,0,0);
const profileSelect=document.querySelector('#qualitySelect');
const isMac=/Mac/i.test(navigator.userAgent);
const isMobile=/Android|iPhone|iPad/i.test(navigator.userAgent);
const defaultQuality=(isMac||isMobile)?'eco':'balanced';
let activeQuality=defaultQuality;
let maxFrameRate=60;
let localLightBudget=0;
let qualityRainEnabled=true;
function setQuality(mode){
  activeQuality=mode==='auto'?defaultQuality:mode;
  if(!['performance','eco','balanced','high'].includes(activeQuality))activeQuality='eco';
  const q={performance:{pixel:.65,shadows:false,fps:120,lights:0,rain:false},eco:{pixel:.85,shadows:false,fps:120,lights:0,rain:false},balanced:{pixel:1,shadows:false,fps:90,lights:2,rain:true},high:{pixel:Math.min(devicePixelRatio||1,1.5),shadows:true,fps:60,lights:4,rain:true}}[activeQuality];
  renderer.setPixelRatio(q.pixel);renderer.shadowMap.enabled=q.shadows;moon.castShadow=q.shadows;
  maxFrameRate=q.fps;localLightBudget=q.lights;qualityRainEnabled=q.rain;
  rain.visible=rainEnabled&&qualityRainEnabled;
  lastLightBudgetUpdate=-1;
  updateLightBudget(performance.now()/1000);
  const rainButton=document.querySelector('#rainToggle');if(rainButton)rainButton.textContent=qualityRainEnabled?`☂ RAIN ${rainEnabled?'ON':'OFF'}`:'☂ RAIN · ECO OFF';
  if(profileSelect)profileSelect.value=mode;
  resize();
}
if(profileSelect){profileSelect.value='auto';profileSelect.addEventListener('change',()=>setQuality(profileSelect.value));}
// Only the nearest decorative lights contribute per frame; all neon signs remain emissive.
let lastLightBudgetUpdate=-1;
function updateLightBudget(now){
  if(now-lastLightBudgetUpdate<1.0)return;
  lastLightBudgetUpdate=now;
  if(localLightBudget===0){for(const l of managedLights)l.visible=false;return;}
  for(const l of managedLights)l.updateWorldMatrix(true,false);
  const px=player.position.x,pz=player.position.z;
  const selected=managedLights.map(l=>({l,d:(l.matrixWorld.elements[12]-px)**2+(l.matrixWorld.elements[14]-pz)**2})).sort((a,b)=>a.d-b.d);
  selected.forEach(({l,d},i)=>{l.visible=i<localLightBudget&&d<900;l.intensity=l.userData.baseIntensity;});
}
function resize(){const w=game.clientWidth,h=game.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const units=h<550?32:39;const aspect=w/h;camera.left=-units*aspect/2;camera.right=units*aspect/2;camera.top=units/2;camera.bottom=-units/2;camera.updateProjectionMatrix()}
window.addEventListener('resize',resize);resize();
// Mouse raycasting: click a landmark building to read its portfolio chapter.
const raycaster=new THREE.Raycaster();const mouse=new THREE.Vector2();renderer.domElement.addEventListener('click',e=>{if(modal.hidden===false)return;const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects(G.children,true);if(!hits.length)return;const p=hits[0].point;const found=sites.map(s=>({...s,dist:Math.hypot(s.x-p.x,s.z-p.z)})).sort((a,b)=>a.dist-b.dist)[0];if(found&&found.dist<Math.max(found.w/2,found.d/2)+3)showDetail(found.id)});
const lookTarget=new THREE.Vector3();
let elapsed=0;
function update(dt){elapsed+=dt;updateCyberdeck(performance.now()/1000);updateLightBudget(performance.now()/1000);let vx=0,vz=0;if(keyHeld.has('KeyW')||keyHeld.has('ArrowUp'))vz-=1;if(keyHeld.has('KeyS')||keyHeld.has('ArrowDown'))vz+=1;if(keyHeld.has('KeyA')||keyHeld.has('ArrowLeft'))vx-=1;if(keyHeld.has('KeyD')||keyHeld.has('ArrowRight'))vx+=1;const moving=vx||vz;const speed=(mounted?9.3:keyHeld.has('ShiftLeft')||keyHeld.has('ShiftRight')?7.4:4.6)*dt;if(moving&&modal.hidden){const inv=1/Math.hypot(vx,vz);vx*=inv;vz*=inv;const nx=player.position.x+vx*speed,nz=player.position.z+vz*speed;if(!blocked(nx,player.position.z))player.position.x=nx;if(!blocked(player.position.x,nz))player.position.z=nz;player.rotation.y=Math.atan2(vx,vz);body.position.y=Math.sin(elapsed*(mounted?17:11))*(mounted?.015:.045);if(mounted){bike.position.x=player.position.x;bike.position.z=player.position.z;bike.rotation.y=player.rotation.y;bikeBody.rotation.z=Math.sin(elapsed*5)*.02}}else body.position.y=Math.sin(elapsed*2.4)*.018;
const y=terrainHeight(player.position.x,player.position.z);player.position.y+=(y-player.position.y)*Math.min(1,dt*13);
if(mounted){bike.position.y=player.position.y;body.position.y=.75;body.scale.setScalar(.8);body.rotation.x=-.13}else{body.scale.setScalar(1);body.rotation.x=0}
// Natural opposing arm/leg movement with an ease back to a relaxed idle stance.
const gait=moving&&!mounted&&modal.hidden?Math.sin(elapsed*(keyHeld.has('ShiftLeft')||keyHeld.has('ShiftRight')?15:10))*.42:0;
characterLegs[0].rotation.x=mounted?-0.95:gait;
characterLegs[1].rotation.x=mounted?-0.95:-gait;
characterArms[0].rotation.x=mounted?-0.75:-gait*.7;
characterArms[1].rotation.x=mounted?-0.75:gait*.7;
characterArms[0].rotation.z=mounted?-.30:-.12;
characterArms[1].rotation.z=mounted?.30:.12;
let min=100;nearest=null;for(const s of sites){const d=Math.hypot(player.position.x-s.x,player.position.z-s.doorZ);if(d<min){min=d;nearest=s}}if(min>6.5)nearest=null;
const hint=document.querySelector('#interactHint');hint.hidden=!nearest||!modal.hidden;if(nearest){const nextHint=`EXPLORE ${nearest.name}`;const label=document.querySelector('#hintText');if(label.textContent!==nextHint)label.textContent=nextHint;}
let location='CENTRAL CROSSING';if(player.position.z<-18)location='HILLTOP SHRINE';else if(player.position.z>15)location=player.position.x<0?'DEPOT QUARTER':'COURIER QUARTER';else if(player.position.x<-8)location='WORKSHOP ROW';else if(player.position.x>8)location='RESIDENTIAL LANE';const locationLabel=document.querySelector('#locationName');if(locationLabel.textContent!==location)locationLabel.textContent=location;
lookTarget.set(player.position.x,player.position.y+1,player.position.z);look.lerp(lookTarget,Math.min(1,dt*2.2));camera.position.set(look.x,look.y+22,look.z+45);camera.lookAt(look.x,look.y+2,look.z);
for(const fish of hologramFish){const u=fish.userData;fish.position.y=u.baseY+Math.sin(elapsed*1.6+u.phase)*.35;fish.position.x+=Math.sin(elapsed*.8+u.phase)*dt*.55;fish.rotation.y=Math.sin(elapsed*1.2+u.phase)*.45+Math.PI/2;fish.rotation.z=Math.sin(elapsed*2.1+u.phase)*.12;}
if(rainEnabled&&qualityRainEnabled){const arr=rainGeometry.attributes.position.array;for(let i=0;i<rainCount;i++){let y=arr[i*6+1]-dt*14;if(y<.8)y+=24;arr[i*6+1]=y;arr[i*6+4]=y-.75}rainGeometry.attributes.position.needsUpdate=true}
if(performance.now()>toastUntil)document.querySelector('#toast').classList.remove('visible');
}
const perfStats=document.querySelector('#perfStats');
let frameCounter=0,lastStatTime=0;
let lastFrameTime=0;
function animate(timestamp){
  requestAnimationFrame(animate);
  if(document.hidden)return;
  const minInterval=1000/maxFrameRate;
  if(lastFrameTime&&timestamp-lastFrameTime<minInterval-.8)return;
  const dt=Math.min(lastFrameTime?(timestamp-lastFrameTime)/1000:1/60,.05);
  lastFrameTime=timestamp;
  update(dt);renderer.render(scene,camera);
  frameCounter++;if(timestamp-lastStatTime>=1000){if(perfStats)perfStats.textContent=`${Math.round(frameCounter*1000/Math.max(1,timestamp-lastStatTime))} FPS · ${renderer.info.render.calls} DRAWS`;frameCounter=0;lastStatTime=timestamp;}
}
document.addEventListener('visibilitychange',()=>{lastFrameTime=0});
setQuality('auto');
loading.hidden=true;requestAnimationFrame(animate);
