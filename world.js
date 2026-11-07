import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

const $ = (s) => document.querySelector(s);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070b1b);
scene.fog = new THREE.FogExp2(0x080b22, 0.0061);
const viewport = document.querySelector('#world');
const camera = new THREE.PerspectiveCamera(54, viewport.clientWidth / viewport.clientHeight, 0.15, 900);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
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
box(210,1,210,mat(0x080d1c),0,-1,0);
const grid = new THREE.GridHelper(210, 42, 0x154c70, 0x132441);grid.position.y=-.45;scene.add(grid);
for(let v=-80;v<=80;v+=25){box(1.4,.07,180,basic(0x159eaf,.32),v,-.39,0);box(180,.07,1.4,basic(0x159eaf,.32),0,-.38,v)}
for(let v=-80;v<=80;v+=25){box(.25,.09,180,rand()>.5?cyan:purple,v+13,-.30,0);box(180,.09,.25,rand()>.5?pink:cyan,0,-.30,v-13)}
// Window atlas: a few shared textures minimize rendering overhead
function windowTex(hue){const c=document.createElement('canvas');c.width=128;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#091326';ctx.fillRect(0,0,128,256);
for(let y=5;y<256;y+=13)for(let x=6;x<128;x+=13){let lit=rand()>.31;ctx.fillStyle=lit?(rand()>.85?'#ff4baf':hue):'#142744';ctx.fillRect(x,y,7,7);if(lit&&rand()>.7){ctx.fillStyle='#ffffff35';ctx.fillRect(x,y,7,1)}}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
const tex1=windowTex('#46c7f4'),tex2=windowTex('#c287ff'),tex3=windowTex('#ffd89d');
const facades=[tex1,tex2,tex3].map(t=>new THREE.MeshStandardMaterial({map:t,emissiveMap:t,emissive:0x638bbd,emissiveIntensity:.48,metalness:.12,roughness:.62}));
const solid=[mat(0x141d35),mat(0x14152f),mat(0x102638),mat(0x182239)];
const landmarks=[{id:'talia',name:'TALIA',kind:'RESIDENT / TECH RUNNER',glyph:'✦',x:30,y:10,z:-28,color:'alt',description:'Talia knows every rooftop shortcut in Capri. A quick-thinking courier who keeps the neon district connected. Find her in the eastern sky garden.',details:'SPECIALTY: ROOFTOP ROUTES · HOME: SKY GARDEN'},
{id:'d',name:'D',kind:'RESIDENT / NIGHT PILOT',glyph:'◈',x:-42,y:10,z:34,color:'',description:'D is a legendary night pilot. You might spot their compact airship slipping between the towers. Rumor has it they never miss a midnight skyline run.',details:'SPECIALTY: FLYING · HOME: WEST TERMINAL'},
{id:'arcade',name:'PIXEL ARCADE',kind:'LANDMARK / GAMES',glyph:'▣',x:52,y:25,z:47,color:'alt',description:'An arcade above the clouds, where the city never sleeps. A nod to the joy of exploring games and the systems behind them.',details:'ACTIVITY: NIGHT GAMES · OPEN: ALWAYS'},
{id:'core',name:'NEON CORE',kind:'LANDMARK / CITY HEART',glyph:'◇',x:-30,y:43,z:-48,color:'',description:'The central computation tower lights the district. Every moving craft, holographic street and pulsing window is part of this tiny simulated world.',details:'SYSTEM: CITY GRID · STATUS: ONLINE'}];
const reserved=(x,z)=>landmarks.some(l=>Math.abs(l.x-x)<18&&Math.abs(l.z-z)<18)||Math.abs(x)<15&&Math.abs(z)<15;
// skyline, parks and light strips
const rooflights=[];
for(let ix=-3;ix<=3;ix++)for(let iz=-3;iz<=3;iz++){
 let gx=ix*25,gz=iz*25; if(reserved(gx,gz)||rand()>.88)continue;
 let h=13+Math.pow(rand(),1.8)*45; if(Math.abs(ix)<3&&Math.abs(iz)<3)h*=1.2;
 let width=11+rand()*5,depth=11+rand()*6;
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
tower(-30,-48,41,'NEON CORE',cyan);tower(52,47,23,'PIXEL',pink);
// Sky gardens & character figurines
function garden(x,z,accent){box(25,3,24,mat(0x192c3d),x,5,z);box(26,.6,25,accent,x,6.7,z);for(let i=0;i<6;i++){const xx=x+(rand()-.5)*18,zz=z+(rand()-.5)*17;cylinder(.7,1,2,mat(0x263d42),xx,8,zz);sphere(2.1,mat(0x0a7b77,0x23e6a0,.18),xx,10,zz)}}
garden(30,-28,pink);garden(-42,34,cyan);
// Super-deformed, original chibi pedestrians with bobbing heads and animated legs.
const pedestrians=[];
function resident(x,z,bodyCol,hairCol,accent,name='CITIZEN',roof=false){
 const p=new THREE.Group();p.position.set(x,roof?7.9:0.6,z);scene.add(p);
 const jacket=mat(bodyCol),skin=mat(0xe7ad90),hair=mat(hairCol);
 // Head takes up nearly half the entire character height, like a tiny handheld RPG sprite.
 const body=sphere(.88,jacket,0,1.3,0,p); body.scale.set(1,1.2,.7);
 sphere(1.2,skin,0,3.25,0,p);const cap=sphere(1.23,hair,0,3.78,-.12,p);cap.scale.y=.57;
 for(const side of [-1,1]){sphere(.13,basic(0x151b30),side*.44,3.34,.98,p);sphere(.065,basic(0xffffff),side*.4,3.4,1.085,p)}
 const legs=[];for(const side of [-1,1]){const leg=new THREE.Group();leg.position.set(side*.4,.87,0);p.add(leg);box(.34,.95,.36,mat(0x1a2440),0,-.47,0,leg);box(.39,.21,.66,accent,0,-.96,.17,leg);legs.push(leg);const arm=sphere(.28,jacket,side*1.0,1.65,.0,p);arm.scale.y=1.4}
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.8,.08,8,32),accent);ring.rotation.x=Math.PI/2;ring.position.y=.1;p.add(ring);
 const record={p,ring,legs,x,z,roof,phase:rand()*6.28,range:roof?5:4.5,speed:roof?.35:.22,name};pedestrians.push(record);return record;
}
const talia=resident(30,-28,0x812b8d,0x151129,pink,'TALIA',true),d=resident(-42,34,0x1b5682,0x11152b,cyan,'D',true);
for(let i=0;i<15;i++){let x=-62+(i%5)*30,z=-66+Math.floor(i/5)*58;resident(x,z,[0x334f8e,0x7b427e,0x267a85][i%3],0x11162e,i%2?pink:cyan,'CITIZEN '+(i+1));}
// Elevated sky-rail train and paired tracks looping through the miniature district.
const trainCars=[],railMaterial=mat(0x152b41),railGlow=mat(0x1fcac8,neonCyan,.75);
for(const z of [-22,22]){box(181,.36,.65,railGlow,0,19,z);box(181,1.1,3.4,railMaterial,0,18,z);for(let x=-80;x<=80;x+=25){box(1.5,18,1.6,mat(0x142b3c),x,8.5,z)}}
for(let i=0;i<5;i++){const g=new THREE.Group();scene.add(g);box(8,2.9,3.8,mat(0x182d45),0,0,0,g);box(8.1,.25,4.2,i%2?pink:cyan,0,1.45,0,g);for(let q=-2;q<=2;q++)box(.75,1.2,.08,basic(0x71f7ff),q*1.5,.3,1.96,g);trainCars.push({g,offset:i*10});}
// Four illuminated project ads; discover the projects by clicking their floating markers.
const projects=[
 {id:'cora',name:'CORA / ACE',kind:'PROJECT / AI COST ESTIMATION',glyph:'▤',x:-63,y:30,z:-36,color:'alt',description:'All-Purpose Cost Estimator: an AI-assisted capstone built with a five-person team, combining requirements processing and 10,000-trial cost simulations.',details:'PYTHON · STREAMLIT · PYDANTIC · MONTE CARLO'},
 {id:'sage',name:'SAGEAI',kind:'PROJECT / HACKATHON WINNER',glyph:'✚',x:60,y:29,z:-34,color:'',description:'SageAI is a hackathon-winning prototype exploring AI-assisted healthcare assessments using text and image inputs.',details:'GENAI GENESIS · BEST AI IN HEALTHCARE · 2024',url:'https://devpost.com/software/sageai'},
 {id:'gis',name:'GIS ROUTER',kind:'PROJECT / PATHFINDING',glyph:'⌘',x:-62,y:30,z:59,color:'',description:'A C++ mapping and navigation engine using A* and Dijkstra algorithms across city street networks.',details:'C++ · GRAPH ALGORITHMS · PATHFINDING'},
 {id:'memory',name:'MEMORY LAB',kind:'PROJECT / SYSTEMS',glyph:'▦',x:64,y:30,z:58,color:'alt',description:'A custom C allocator supporting allocation, freeing and resizing with 16-byte alignment and performance testing.',details:'C · MEMORY MANAGEMENT · SYSTEMS'}
];
landmarks.push(...projects);
function billboardTexture(title,small,tint){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle='#061124';c.fillRect(0,0,512,256);c.strokeStyle=tint;c.lineWidth=12;c.strokeRect(8,8,496,240);c.fillStyle=tint;c.font='bold 56px sans-serif';c.textAlign='center';c.shadowColor=tint;c.shadowBlur=26;c.fillText(title,256,118);c.shadowBlur=0;c.font='25px monospace';c.fillStyle='#dfedff';c.fillText(small,256,180);return new THREE.CanvasTexture(canvas)}
for(let i=0;i<projects.length;i++){const l=projects[i],color=i%2?'#65f9f4':'#ff65af';const support=mat(0x10243c);box(2,24,2,support,l.x,12,l.z);let tex=billboardTexture(l.name,i===0?'AI COST ESTIMATION':i===1?'BEST AI IN HEALTHCARE':i===2?'C++ PATHFINDING':'C ALLOCATOR',color);const sign=new THREE.Mesh(new THREE.PlaneGeometry(21,10.5),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));sign.position.set(l.x,27,l.z);scene.add(sign);sphere(1.2,i%2?cyan:pink,l.x,34,l.z)}
// Traffic: flying vehicles traveling through continuous routes
const cars=[];
function vehicle(color=cyan,player=false){const g=new THREE.Group();let dark=mat(0x121a30);box(player?4.6:3.5,.8,player?7.5:6,dark,0,0,0,g);box(player?3.1:2.4,.85,player?2.9:2.3,mat(0x145b70,0x14b6e7,.28),0,.8,-.4,g);box(3.8,.18,1.3,color,0,.08,2.2,g);box(3.8,.18,1.3,color,0,.08,-2.2,g);for(let side of [-1,1]){box(.6,.25,2,color,side*2.1,-.28,-.3,g);sphere(.32,color,side*2.05,-.4,2.5,g)}let glow=new THREE.PointLight(color===pink?neonPink:neonCyan,player?5:2.2,player?25:15);glow.position.set(0,-1,0);g.add(glow);return g}
for(let i=0;i<12;i++){let obj=vehicle(rand()>.5?pink:cyan);scene.add(obj);let radius=20+rand()*45,theta=rand()*Math.PI*2,alt=16+rand()*33,spd=.11+rand()*.17;cars.push({obj,radius,theta,alt,spd,phase:rand()*10});}
// Player's vehicle: hover and boost lights
const player=vehicle(cyan,true);scene.add(player);player.position.set(0,17,4);
const trail=[];for(let i=0;i<12;i++){let s=sphere(.25,basic(i%2?0x49efff:0xff5cae,.38),0,-50,0);trail.push(s)}
// Sky, stars, moons and rain-like vertical light artifacts
const starGeo=new THREE.BufferGeometry(),starPos=[];for(let i=0;i<1000;i++){starPos.push((rand()-.5)*800,80+rand()*290,(rand()-.5)*800)}starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0x8fc5ff,size:1.4,sizeAttenuation:true,transparent:true,opacity:.8}));scene.add(stars);
sphere(30,new THREE.MeshBasicMaterial({color:0x8e8de0}),-270,245,-350);
const shards=[];
const shardPositions=[[-47,23,-8],[45,29,22],[3,28,58],[-54,21,-53],[40,31,-42],[-15,17,52]];
for(let i=0;i<6;i++){let geo=new THREE.OctahedronGeometry(2.4),obj=new THREE.Mesh(geo,purple);obj.position.set(...shardPositions[i]);const light=new THREE.PointLight(neonPurple,2,14);obj.add(light);scene.add(obj);shards.push({obj,base:obj.position.y,done:false,idx:i})}
// Navigational markers overlay; hover icons open on click
const markerEl=$('#markers');
const markerRecords=landmarks.map((l)=>{const el=document.createElement('button');el.className='marker '+l.color;el.setAttribute('aria-label','Explore '+l.name);el.innerHTML=`<i>${l.glyph}</i><span>${l.name}<small>${l.kind}</small></span>`;el.addEventListener('click',()=>openDialog(l));markerEl.appendChild(el);return {l,el}});
const intro=$('#intro'),hud=$('#hud'),dialog=$('#dialogBackdrop');let started=false,dialogOpen=false;
function openDialog(l){if(!started)return;dialogOpen=true;$('#dialogKind').textContent=l.kind;$('#dialogGlyph').textContent=l.glyph;$('#dialogTitle').textContent=l.name;$('#dialogDescription').textContent=l.description;$('#dialogDetails').textContent=l.details;const link=$('#dialogLink');link.hidden=!l.url;link.href=l.url||'#';dialog.hidden=false}
function closeDialog(){dialogOpen=false;dialog.hidden=true}
$('#dialogClose').addEventListener('click',closeDialog);$('#dialogOkay').addEventListener('click',closeDialog);dialog.addEventListener('click',e=>{if(e.target===dialog)closeDialog()});
const keys=new Set();const movementKeys=['w','a','s','d','control',' ','shift','arrowup','arrowdown','arrowleft','arrowright'];
addEventListener('keydown',e=>{const k=e.key.toLowerCase()==='spacebar'?' ':e.key.toLowerCase();if(movementKeys.includes(k)){keys.add(k);e.preventDefault()}if(k==='escape'&&dialogOpen)closeDialog()});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()==='spacebar'?' ':e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());
for(let b of document.querySelectorAll('[data-key]')){const k=b.dataset.key;const down=e=>{e.preventDefault();keys.add(k)};const up=e=>{e.preventDefault();keys.delete(k)};b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointerleave',up);b.addEventListener('pointercancel',up)}
let camYaw=0.25,camPitch=.29,drag=false,px=0,py=0;
renderer.domElement.addEventListener('pointerdown',e=>{if(!started)return;drag=true;px=e.clientX;py=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag)return;camYaw-=(e.clientX-px)*.004;camPitch=THREE.MathUtils.clamp(camPitch+(e.clientY-py)*.003,-.2,.85);px=e.clientX;py=e.clientY});renderer.domElement.addEventListener('pointerup',()=>drag=false);renderer.domElement.addEventListener('pointercancel',()=>drag=false);
$('#recenter').addEventListener('click',()=>{camYaw=.25;camPitch=.29;player.position.set(0,17,4)});$('#helpBtn').addEventListener('click',()=>openDialog({name:'FLIGHT CONTROLS',kind:'PILOT MANUAL',glyph:'⌘',description:'WASD or arrow keys move your hovercraft. Press Space to rise, Ctrl to descend, Shift to boost. Click and drag the city to rotate the camera. On mobile, use the on-screen flight buttons.',details:'MISSION: COLLECT 6 SHARDS · MEET TALIA & D'}));
const toast=$('#toast');let toastTimer=0;function showToast(text){toast.textContent=text;toast.classList.add('show');toastTimer=3.3}
$('#start').addEventListener('click',()=>{started=true;intro.classList.add('hidden');hud.hidden=false;showToast('CAPRI-01 ONLINE · EXPLORE THE CITY')});
const tmp=new THREE.Vector3(), desired=new THREE.Vector3(), motion=new THREE.Vector3(),camLook=new THREE.Vector3();let spin=0,score=0;
function animate(){requestAnimationFrame(animate);let dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;spin+=dt;
for(const n of pedestrians){const a=t*n.speed+n.phase;n.p.position.x=n.x+Math.sin(a)*n.range;n.p.position.z=n.z+Math.cos(a)*n.range;n.p.position.y=(n.roof?7.9:.6)+Math.abs(Math.sin(t*5+n.phase))*.09;n.p.rotation.y=Math.atan2(Math.cos(a),-Math.sin(a));n.legs[0].rotation.x=Math.sin(t*5+n.phase)*.5;n.legs[1].rotation.x=-Math.sin(t*5+n.phase)*.5;n.ring.rotation.z=t*.45;}
for(let i=0;i<trainCars.length;i++){const v=trainCars[i],z=(i<3?-22:22),progress=(t*11+v.offset)%178;v.g.position.set(-89+progress,20.2,z);v.g.rotation.y=0;}
for(let c of cars){c.theta+=dt*c.spd;let x=Math.cos(c.theta)*c.radius,z=Math.sin(c.theta)*c.radius;c.obj.position.set(x,c.alt+Math.sin(t*1.2+c.phase)*.8,z);c.obj.rotation.y=-c.theta;c.obj.rotation.z=Math.sin(t*1.5+c.phase)*.06}
for(let s of shards){if(s.done)continue;s.obj.rotation.y+=dt*.8;s.obj.rotation.z+=dt*.4;s.obj.position.y=s.base+Math.sin(t*2+s.idx)*1.3}

if(started&&!dialogOpen){let forward=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'));let side=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));let rise=Number(keys.has(' '))-Number(keys.has('control'));let speed=keys.has('shift')?35:18;
let dirForward=new THREE.Vector3(Math.sin(camYaw),0,-Math.cos(camYaw)),dirRight=new THREE.Vector3(Math.cos(camYaw),0,Math.sin(camYaw));desired.copy(dirForward.multiplyScalar(forward)).add(dirRight.multiplyScalar(side));if(desired.lengthSq()>1)desired.normalize();desired.y=rise*.62;desired.multiplyScalar(speed);motion.lerp(desired,Math.min(1,dt*3.7));player.position.addScaledVector(motion,dt);player.position.y=THREE.MathUtils.clamp(player.position.y,6,58);player.position.x=THREE.MathUtils.clamp(player.position.x,-77,77);player.position.z=THREE.MathUtils.clamp(player.position.z,-77,77);
if(motion.lengthSq()>5){let targetYaw=Math.atan2(motion.x,-motion.z);let turn=Math.atan2(Math.sin(targetYaw-player.rotation.y),Math.cos(targetYaw-player.rotation.y));player.rotation.y+=turn*Math.min(1,dt*3.5)}player.rotation.z=THREE.MathUtils.lerp(player.rotation.z,-side*.10,dt*3);player.rotation.x=THREE.MathUtils.lerp(player.rotation.x,-forward*.055,dt*2);
$('#altitude').textContent=Math.round(player.position.y)+'m';$('#speed').textContent=Math.round(motion.length()*3.6);$('#heading').textContent=Math.round(((player.rotation.y*180/Math.PI)%360+360)%360)+'°';
for(const s of shards){if(s.done)continue;if(player.position.distanceTo(s.obj.position)<7){s.done=true;scene.remove(s.obj);score++;$('#shards').textContent=score;showToast(score===6?'ALL DATA SHARDS COLLECTED · DISTRICT COMPLETE!':`DATA SHARD ACQUIRED · ${score}/6`)}}
} else if(!started){player.rotation.y=Math.sin(t*.1)*.4}
player.position.y+=Math.sin(t*3)*dt*.45;
const dist=started?19:35, height=started?12:20;const ofs=new THREE.Vector3(Math.sin(camYaw)*dist*Math.cos(camPitch),height+Math.sin(camPitch)*18,Math.cos(camYaw)*dist*Math.cos(camPitch));const target=player.position.clone().add(ofs);if(!started){target.set(42,39,75);camLook.set(0,22,0)}else camLook.copy(player.position).add(new THREE.Vector3(0,2,0));camera.position.lerp(target,Math.min(1,dt*2.8));camera.lookAt(camLook);
for(let i=0;i<trail.length;i++){const tr=trail[i];let off=(i+1)*1.7;tr.position.copy(player.position).add(new THREE.Vector3(0,-1.1,off).applyAxisAngle(new THREE.Vector3(0,1,0),player.rotation.y));tr.scale.setScalar(Math.max(.3,1-i*.075));tr.visible=started&&motion.length()>2}
for(let {l,el} of markerRecords){if(!started){el.style.display='none';continue}tmp.set(l.x,l.y+7,l.z);const distance=camera.position.distanceTo(tmp);tmp.project(camera);if(tmp.z>1||distance>125||Math.abs(tmp.x)>1.12||Math.abs(tmp.y)>1.15){el.style.display='none'}else{el.style.display='flex';el.style.left=(viewport.getBoundingClientRect().left+(tmp.x*.5+.5)*viewport.clientWidth)+'px';el.style.top=(viewport.getBoundingClientRect().top+(-tmp.y*.5+.5)*viewport.clientHeight)+'px';el.style.opacity=String(Math.min(1,(230-distance)/65))}}
if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)toast.classList.remove('show')}
renderer.render(scene,camera)}
$('#loading').classList.add('out');setTimeout(()=>$('#loading').remove(),650);
animate();
addEventListener('resize',()=>{camera.aspect=viewport.clientWidth/viewport.clientHeight;camera.updateProjectionMatrix();renderer.setSize(viewport.clientWidth,viewport.clientHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7))});
