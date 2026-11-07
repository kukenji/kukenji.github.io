import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

const $ = (s) => document.querySelector(s);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070b1b);
scene.fog = new THREE.FogExp2(0x080b22, 0.0039);
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.15, 900);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.32;
$('#world').appendChild(renderer.domElement);
const ambient = new THREE.HemisphereLight(0x6374f7, 0x090d23, 1.65); scene.add(ambient);
const moon = new THREE.DirectionalLight(0x95d2ff, 2); moon.position.set(-100, 180, -80);scene.add(moon);
const neonCyan = 0x42f3f3, neonPink = 0xff3d9e, neonPurple = 0x8369ff;
const clock = new THREE.Clock();
const rand = (()=>{let x=167200;return()=>((x=Math.imul(x,1664525)+1013904223|0)>>>0)/4294967296})();
const mat=(color, emissive=0, ei=0)=>new THREE.MeshStandardMaterial({color, metalness:.4, roughness:.48, emissive, emissiveIntensity:ei});
const basic=(color,opacity=1)=>new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity});
const cyan=mat(0x207f9e,neonCyan,1.2), pink=mat(0x9f2a6a,neonPink,1.7), purple=mat(0x4c3a9b,neonPurple,1.3);
const box=(w,h,d,m,x=0,y=0,z=0,parent=scene)=>{const a=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);a.position.set(x,y,z);parent.add(a);return a};
const sphere=(r,m,x,y,z,parent=scene)=>{let a=new THREE.Mesh(new THREE.SphereGeometry(r,12,8),m);a.position.set(x,y,z);parent.add(a);return a};
const cylinder=(r1,r2,h,m,x,y,z,parent=scene)=>{let a=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,12),m);a.position.set(x,y,z);parent.add(a);return a};
// Ground, reflective-looking grid and neon expressways
box(590,1,590,mat(0x080d1c),0,-1,0);
const grid = new THREE.GridHelper(590, 92, 0x154c70, 0x132441);grid.position.y=-.45;scene.add(grid);
for(let v=-192;v<=192;v+=32){box(1.4,.07,415,basic(0x159eaf,.32),v,-.39,0);box(415,.07,1.4,basic(0x159eaf,.32),0,-.38,v)}
for(let v=-192;v<=192;v+=32){box(.25,.09,415,rand()>.5?cyan:purple,v+13,-.30,0);box(415,.09,.25,rand()>.5?pink:cyan,0,-.30,v-13)}
// Window atlas: a few shared textures minimize rendering overhead
function windowTex(hue){const c=document.createElement('canvas');c.width=128;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#091326';ctx.fillRect(0,0,128,256);
for(let y=5;y<256;y+=13)for(let x=6;x<128;x+=13){let lit=rand()>.31;ctx.fillStyle=lit?(rand()>.85?'#ff4baf':hue):'#142744';ctx.fillRect(x,y,7,7);if(lit&&rand()>.7){ctx.fillStyle='#ffffff35';ctx.fillRect(x,y,7,1)}}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
const tex1=windowTex('#46c7f4'),tex2=windowTex('#c287ff'),tex3=windowTex('#ffd89d');
const facades=[tex1,tex2,tex3].map(t=>new THREE.MeshStandardMaterial({map:t,emissiveMap:t,emissive:0x638bbd,emissiveIntensity:.48,metalness:.12,roughness:.62}));
const solid=[mat(0x141d35),mat(0x14152f),mat(0x102638),mat(0x182239)];
const landmarks=[{id:'talia',name:'TALIA',kind:'RESIDENT / TECH RUNNER',glyph:'✦',x:34,y:10,z:-35,color:'alt',description:'Talia knows every rooftop shortcut in Capri. A quick-thinking courier who keeps the neon district connected. Find her in the eastern sky garden.',details:'SPECIALTY: ROOFTOP ROUTES · HOME: SKY GARDEN'},
{id:'d',name:'D',kind:'RESIDENT / NIGHT PILOT',glyph:'◈',x:-56,y:10,z:34,color:'',description:'D is a legendary night pilot. You might spot their compact airship slipping between the towers. Rumor has it they never miss a midnight skyline run.',details:'SPECIALTY: FLYING · HOME: WEST TERMINAL'},
{id:'arcade',name:'PIXEL ARCADE',kind:'LANDMARK / GAMES',glyph:'▣',x:60,y:25,z:63,color:'alt',description:'An arcade above the clouds, where the city never sleeps. A nod to the joy of exploring games and the systems behind them.',details:'ACTIVITY: NIGHT GAMES · OPEN: ALWAYS'},
{id:'core',name:'NEON CORE',kind:'LANDMARK / CITY HEART',glyph:'◇',x:-36,y:43,z:-58,color:'',description:'The central computation tower lights the district. Every moving craft, holographic street and pulsing window is part of this tiny simulated world.',details:'SYSTEM: CITY GRID · STATUS: ONLINE'}];
const reserved=(x,z)=>landmarks.some(l=>Math.abs(l.x-x)<22&&Math.abs(l.z-z)<22)||Math.abs(x)<22&&Math.abs(z)<22;
// skyline, parks and light strips
const rooflights=[];
for(let ix=-6;ix<=6;ix++)for(let iz=-6;iz<=6;iz++){
 let gx=ix*32,gz=iz*32; if(reserved(gx,gz)||rand()>.88)continue;
 let h=18+Math.pow(rand(),1.8)*115; if(Math.abs(ix)<3&&Math.abs(iz)<3)h*=1.2;
 let width=14+rand()*8,depth=14+rand()*9;
 const b=new THREE.Group();b.position.set(gx+(rand()-.5)*4,0,gz+(rand()-.5)*4);scene.add(b);
 let casing=solid[Math.floor(rand()*solid.length)], facade=facades[Math.floor(rand()*facades.length)];
 const geom=new THREE.BoxGeometry(width,h,depth);const mesh=new THREE.Mesh(geom,[facade,facade,casing,casing,facade,facade]);mesh.position.y=h/2;b.add(mesh);
 box(width+1,1.1,depth+1,casing,0,h+.6,0,b);
 const n=rand()>.55?cyan:pink;box(width+1,.55,depth+1,n,0,h+1.15,0,b);
 for(const sy of [h*.26,h*.58,h*.83]){if(rand()>.48){box(width+.35,.14,depth+.35,n,0,sy,0,b)}}
 if(rand()>.65){cylinder(.6,.6,6,casing,0,h+4,0,b);sphere(.8,pink,0,h+7,0,b)}
 if(rand()>.64){const sign=makeSign(['KAI','NOVA','CITY 09','VOID','CAPRI','ZENITH'][Math.floor(rand()*6)],rand()>.5?'#ff5ba7':'#62ffff'); const mesh=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(width,22),4.5),new THREE.MeshBasicMaterial({map:sign,transparent:true,side:THREE.DoubleSide,depthWrite:false}));mesh.position.set(0,Math.min(h-2,22),depth/2+.15);b.add(mesh)}
 if(rand()>.70)rooflights.push(sphere(.5,n,0,h+2,0,b));
}
function makeSign(str,color){let c=document.createElement('canvas');c.width=256;c.height=64;let q=c.getContext('2d');q.fillStyle='#040a1dcc';q.fillRect(0,0,256,64);q.strokeStyle=color;q.lineWidth=3;q.strokeRect(4,4,248,56);q.font='bold 35px Arial';q.textAlign='center';q.textBaseline='middle';q.fillStyle=color;q.shadowColor=color;q.shadowBlur=15;q.fillText(str,128,33);return new THREE.CanvasTexture(c)}
// Special buildings at narrative markers
function tower(x,z,height,label,accent){box(21,height,21,mat(0x16233d),x,height/2,z);for(let k=0;k<height;k+=5){box(22,.34,22,accent,x,k+4,z)}box(25,2,25,accent,x,height+1,z);const t=makeSign(label,accent===pink?'#ff79b7':'#7efaff');let sign=new THREE.Mesh(new THREE.PlaneGeometry(23,7),new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.DoubleSide}));sign.position.set(x,height*.7,z+11.1);scene.add(sign)}
tower(-36,-58,41,'NEON CORE',cyan);tower(60,63,23,'PIXEL',pink);
// Sky gardens & character figurines
function garden(x,z,accent){box(25,3,24,mat(0x192c3d),x,5,z);box(26,.6,25,accent,x,6.7,z);for(let i=0;i<6;i++){const xx=x+(rand()-.5)*18,zz=z+(rand()-.5)*17;cylinder(.7,1,2,mat(0x263d42),xx,8,zz);sphere(2.1,mat(0x0a7b77,0x23e6a0,.18),xx,10,zz)}}
garden(34,-35,pink);garden(-56,34,cyan);
function resident(x,z,bodyCol,hairCol,accent){const p=new THREE.Group();p.position.set(x,7.5,z);scene.add(p);
const m=mat(bodyCol);cylinder(1.1,.65,2.8,m,0,2,0,p);sphere(.72,mat(0xe0a989),0,3.86,0,p);sphere(.81,mat(hairCol),0,4.28,-.10,p);box(.43,1.8,.44,m,-.54,.26,0,p);box(.43,1.8,.44,m,.54,.26,0,p);box(.38,.55,.3,accent,-1.12,2.35,0,p);box(.38,.55,.3,accent,1.12,2.35,0,p);let ring=new THREE.Mesh(new THREE.TorusGeometry(2.7,.09,8,42),accent);ring.rotation.x=Math.PI/2;ring.position.y=.1;p.add(ring);return {p,ring}}
const talia=resident(34,-35,0x43194d,0x11102a,pink),d=resident(-56,34,0x142c45,0x090b21,cyan);
// Traffic: flying vehicles traveling through continuous routes
const cars=[];
function vehicle(color=cyan,player=false){const g=new THREE.Group();let dark=mat(0x121a30);box(player?4.6:3.5,.8,player?7.5:6,dark,0,0,0,g);box(player?3.1:2.4,.85,player?2.9:2.3,mat(0x145b70,0x14b6e7,.28),0,.8,-.4,g);box(3.8,.18,1.3,color,0,.08,2.2,g);box(3.8,.18,1.3,color,0,.08,-2.2,g);for(let side of [-1,1]){box(.6,.25,2,color,side*2.1,-.28,-.3,g);sphere(.32,color,side*2.05,-.4,2.5,g)}let glow=new THREE.PointLight(color===pink?neonPink:neonCyan,player?5:2.2,player?25:15);glow.position.set(0,-1,0);g.add(glow);return g}
for(let i=0;i<19;i++){let obj=vehicle(rand()>.5?pink:cyan);scene.add(obj);let radius=45+rand()*145,theta=rand()*Math.PI*2,alt=19+rand()*73,spd=.11+rand()*.17;cars.push({obj,radius,theta,alt,spd,phase:rand()*10});}
// Player's vehicle: hover and boost lights
const player=vehicle(cyan,true);scene.add(player);player.position.set(0,26,4);
const trail=[];for(let i=0;i<12;i++){let s=sphere(.25,basic(i%2?0x49efff:0xff5cae,.38),0,-50,0);trail.push(s)}
// Sky, stars, moons and rain-like vertical light artifacts
const starGeo=new THREE.BufferGeometry(),starPos=[];for(let i=0;i<1000;i++){starPos.push((rand()-.5)*800,80+rand()*290,(rand()-.5)*800)}starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0x8fc5ff,size:1.4,sizeAttenuation:true,transparent:true,opacity:.8}));scene.add(stars);
sphere(30,new THREE.MeshBasicMaterial({color:0x8e8de0}),-270,245,-350);
const shards=[];
const shardPositions=[[-100,31,-12],[116,51,40],[4,58,119],[-91,36,-117],[79,75,-96],[-18,25,70]];
for(let i=0;i<6;i++){let geo=new THREE.OctahedronGeometry(2.4),obj=new THREE.Mesh(geo,purple);obj.position.set(...shardPositions[i]);const light=new THREE.PointLight(neonPurple,2,14);obj.add(light);scene.add(obj);shards.push({obj,base:obj.position.y,done:false,idx:i})}
// Navigational markers overlay; hover icons open on click
const markerEl=$('#markers');
const markerRecords=landmarks.map((l)=>{const el=document.createElement('button');el.className='marker '+l.color;el.setAttribute('aria-label','Explore '+l.name);el.innerHTML=`<i>${l.glyph}</i><span>${l.name}<small>${l.kind}</small></span>`;el.addEventListener('click',()=>openDialog(l));markerEl.appendChild(el);return {l,el}});
const intro=$('#intro'),hud=$('#hud'),dialog=$('#dialogBackdrop');let started=false,dialogOpen=false;
function openDialog(l){if(!started)return;dialogOpen=true;$('#dialogKind').textContent=l.kind;$('#dialogGlyph').textContent=l.glyph;$('#dialogTitle').textContent=l.name;$('#dialogDescription').textContent=l.description;$('#dialogDetails').textContent=l.details;dialog.hidden=false}
function closeDialog(){dialogOpen=false;dialog.hidden=true}
$('#dialogClose').addEventListener('click',closeDialog);$('#dialogOkay').addEventListener('click',closeDialog);dialog.addEventListener('click',e=>{if(e.target===dialog)closeDialog()});
const keys=new Set();const movementKeys=['w','a','s','d','q','e','shift','arrowup','arrowdown','arrowleft','arrowright'];
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(movementKeys.includes(k)){keys.add(k);e.preventDefault()}if(k==='escape'&&dialogOpen)closeDialog()});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());
for(let b of document.querySelectorAll('[data-key]')){const k=b.dataset.key;const down=e=>{e.preventDefault();keys.add(k)};const up=e=>{e.preventDefault();keys.delete(k)};b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointerleave',up);b.addEventListener('pointercancel',up)}
let camYaw=0.25,camPitch=.29,drag=false,px=0,py=0;
renderer.domElement.addEventListener('pointerdown',e=>{if(!started)return;drag=true;px=e.clientX;py=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag)return;camYaw-=(e.clientX-px)*.004;camPitch=THREE.MathUtils.clamp(camPitch+(e.clientY-py)*.003,-.2,.85);px=e.clientX;py=e.clientY});renderer.domElement.addEventListener('pointerup',()=>drag=false);renderer.domElement.addEventListener('pointercancel',()=>drag=false);
$('#recenter').addEventListener('click',()=>{camYaw=.25;camPitch=.29;player.position.set(0,26,4)});$('#helpBtn').addEventListener('click',()=>openDialog({name:'FLIGHT CONTROLS',kind:'PILOT MANUAL',glyph:'⌘',description:'WASD or arrow keys move your hovercraft. Press E to rise, Q to descend, Shift to boost. Click and drag the city to rotate the camera. On mobile, use the on-screen flight buttons.',details:'MISSION: COLLECT 6 SHARDS · MEET TALIA & D'}));
const toast=$('#toast');let toastTimer=0;function showToast(text){toast.textContent=text;toast.classList.add('show');toastTimer=3.3}
$('#start').addEventListener('click',()=>{started=true;intro.classList.add('hidden');hud.hidden=false;showToast('CAPRI-01 ONLINE · EXPLORE THE CITY')});
const tmp=new THREE.Vector3(), desired=new THREE.Vector3(), motion=new THREE.Vector3(),camLook=new THREE.Vector3();let spin=0,score=0;
function animate(){requestAnimationFrame(animate);let dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;spin+=dt;
for(let c of cars){c.theta+=dt*c.spd;let x=Math.cos(c.theta)*c.radius,z=Math.sin(c.theta)*c.radius;c.obj.position.set(x,c.alt+Math.sin(t*1.2+c.phase)*.8,z);c.obj.rotation.y=-c.theta;c.obj.rotation.z=Math.sin(t*1.5+c.phase)*.06}
for(let s of shards){if(s.done)continue;s.obj.rotation.y+=dt*.8;s.obj.rotation.z+=dt*.4;s.obj.position.y=s.base+Math.sin(t*2+s.idx)*1.3}
talia.ring.rotation.z=t*.5;d.ring.rotation.z=-t*.6;talia.p.rotation.y=Math.sin(t*.6)*.25;d.p.rotation.y=Math.sin(t*.7)*.28;
if(started&&!dialogOpen){let forward=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'));let side=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));let rise=Number(keys.has('e'))-Number(keys.has('q'));let speed=keys.has('shift')?64:30;
let dirForward=new THREE.Vector3(Math.sin(camYaw),0,-Math.cos(camYaw)),dirRight=new THREE.Vector3(Math.cos(camYaw),0,Math.sin(camYaw));desired.copy(dirForward.multiplyScalar(forward)).add(dirRight.multiplyScalar(side));if(desired.lengthSq()>1)desired.normalize();desired.y=rise*.62;desired.multiplyScalar(speed);motion.lerp(desired,Math.min(1,dt*3.7));player.position.addScaledVector(motion,dt);player.position.y=THREE.MathUtils.clamp(player.position.y,7,130);player.position.x=THREE.MathUtils.clamp(player.position.x,-198,198);player.position.z=THREE.MathUtils.clamp(player.position.z,-198,198);
if(motion.lengthSq()>5){let targetYaw=Math.atan2(motion.x,-motion.z);let turn=Math.atan2(Math.sin(targetYaw-player.rotation.y),Math.cos(targetYaw-player.rotation.y));player.rotation.y+=turn*Math.min(1,dt*3.5)}player.rotation.z=THREE.MathUtils.lerp(player.rotation.z,-side*.10,dt*3);player.rotation.x=THREE.MathUtils.lerp(player.rotation.x,-forward*.055,dt*2);
$('#altitude').textContent=Math.round(player.position.y)+'m';$('#speed').textContent=Math.round(motion.length()*3.6);$('#heading').textContent=Math.round(((player.rotation.y*180/Math.PI)%360+360)%360)+'°';
for(const s of shards){if(s.done)continue;if(player.position.distanceTo(s.obj.position)<7){s.done=true;scene.remove(s.obj);score++;$('#shards').textContent=score;showToast(score===6?'ALL DATA SHARDS COLLECTED · DISTRICT COMPLETE!':`DATA SHARD ACQUIRED · ${score}/6`)}}
} else if(!started){player.rotation.y=Math.sin(t*.1)*.4}
player.position.y+=Math.sin(t*3)*dt*.45;
const dist=started?26:43, height=started?14:25;const ofs=new THREE.Vector3(Math.sin(camYaw)*dist*Math.cos(camPitch),height+Math.sin(camPitch)*18,Math.cos(camYaw)*dist*Math.cos(camPitch));const target=player.position.clone().add(ofs);if(!started){target.set(60,48,115);camLook.set(0,22,0)}else camLook.copy(player.position).add(new THREE.Vector3(0,2,0));camera.position.lerp(target,Math.min(1,dt*2.8));camera.lookAt(camLook);
for(let i=0;i<trail.length;i++){const tr=trail[i];let off=(i+1)*1.7;tr.position.copy(player.position).add(new THREE.Vector3(0,-1.1,off).applyAxisAngle(new THREE.Vector3(0,1,0),player.rotation.y));tr.scale.setScalar(Math.max(.3,1-i*.075));tr.visible=started&&motion.length()>2}
for(let {l,el} of markerRecords){if(!started){el.style.display='none';continue}tmp.set(l.x,l.y+7,l.z);const distance=camera.position.distanceTo(tmp);tmp.project(camera);if(tmp.z>1||distance>220||Math.abs(tmp.x)>1.12||Math.abs(tmp.y)>1.15){el.style.display='none'}else{el.style.display='flex';el.style.left=(tmp.x*.5+.5)*innerWidth+'px';el.style.top=(-tmp.y*.5+.5)*innerHeight+'px';el.style.opacity=String(Math.min(1,(230-distance)/65))}}
if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)toast.classList.remove('show')}
renderer.render(scene,camera)}
$('#loading').classList.add('out');setTimeout(()=>$('#loading').remove(),650);
animate();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7))});
