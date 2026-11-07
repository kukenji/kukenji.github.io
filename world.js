import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
const $=s=>document.querySelector(s), container=$('#game');
const scene=new THREE.Scene();scene.background=new THREE.Color('#b9a7a8');scene.fog=new THREE.Fog('#b9a7a8',78,160);
const camera=new THREE.OrthographicCamera(-25,25,17,-17,.1,400);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.6;container.appendChild(renderer.domElement);
const hemi=new THREE.HemisphereLight(0xffe9d0,0x454261,3);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffd5ab,4.3);sun.position.set(-35,60,25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-68;sun.shadow.camera.right=68;sun.shadow.camera.top=68;sun.shadow.camera.bottom=-68;sun.shadow.normalBias=.055;scene.add(sun);scene.add(sun.target);
const palette={grass:0x789e84,grass2:0x8bae87,road:0xd9b5a1,stone:0xcbbeb2,wood:0x70506a,roof:0x625771,teal:0x7cc7c1,neon:0xfa8dbb,pink:0xd87991,cream:0xffe9c6,water:0x80b5c8};
const mat=(color,roughness=.9,emissive=0,intensity=0)=>new THREE.MeshStandardMaterial({color,roughness,emissive,emissiveIntensity:intensity});
const M={grass:mat(palette.grass),grass2:mat(palette.grass2),road:mat(palette.road),wood:mat(palette.wood),roof:mat(palette.roof),cream:mat(palette.cream),stone:mat(palette.stone),water:mat(palette.water,.32,0x274a78,.18),pink:mat(palette.neon,.6,0xf269a8,.25),teal:mat(palette.teal,.6,0x3ca5a5,.16),dark:mat(0x342b46),window:mat(0xffe5ae,.45,0xffd278,.55)};
const rng=(()=>{let n=88773;return()=>((n=Math.imul(n,1664525)+1013904223|0)>>>0)/4294967296})();
function mesh(geometry,material,group=scene,x=0,y=0,z=0){const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o}
const cube=(w,h,d,m,g=scene,x=0,y=0,z=0)=>mesh(new THREE.BoxGeometry(w,h,d),m,g,x,y,z);
const ball=(r,m,g=scene,x=0,y=0,z=0)=>mesh(new THREE.SphereGeometry(r,12,9),m,g,x,y,z);
const cyl=(top,bottom,h,m,g=scene,x=0,y=0,z=0)=>mesh(new THREE.CylinderGeometry(top,bottom,h,9),m,g,x,y,z);
function triangleRoof(w,d,height,m,g){const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,height);shape.closePath();const geom=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false});const o=mesh(geom,m,g,0,0,-d/2);o.castShadow=true;return o}
const world=new THREE.Group();scene.add(world);
// Floating handmade village island: clear lanes, a river, bridges, gardens and low-rise houses.
cube(115,3,102,mat(0x494c56),world,0,-2.5,0);cube(114,.75,101,M.grass,world,0,-.68,0);
for(let i=0;i<75;i++){const x=(rng()-.5)*108,z=(rng()-.5)*95;if(Math.abs(x)<7||Math.abs(z)<9)continue;cube(1+rng()*2,.018,1+rng()*2,rng()>.5?M.grass2:M.grass,world,x,-.26,z)}
cube(10,.035,98,M.road,world,0,-.25,0);cube(106,.035,9,M.road,world,0,-.22,8);cube(106,.035,6,M.road,world,0,-.18,-25);
// river on the south edge, with footbridge.
cube(108,.09,12,M.water,world,0,-.18,29);for(let x=-50;x<52;x+=4){cube(2+rng()*3,.02,.38,mat(0xd9e2c5),world,x,-.08,34+rng()*2)}
for(let z=22.6;z<37;z+=1.1){cube(8,.3,.85,M.wood,world,0,.17,z)}for(let x of [-4.3,4.3])for(let z of [23,37])cyl(.23,.23,2,M.wood,world,x,1,z);
// Small architectural helpers.
function signTexture(title,sub='',bg='#fff6dd',fg='#674b59',trim='#cb9c7d'){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,512,256);c.lineWidth=14;c.strokeStyle=trim;c.strokeRect(10,10,492,236);c.textAlign='center';c.textBaseline='middle';c.fillStyle=fg;c.font='bold 58px sans-serif';c.fillText(title,256,110,462);c.font='bold 24px sans-serif';c.fillStyle='#9c7f84';c.fillText(sub,256,179,460);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function panel(w,h,texture,g,x,y,z,rot=0){const o=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,transparent:true}),g,x,y,z);o.rotation.y=rot;return o}
const houses=[];
function house(x,z,w,d,wallColor,roofColor,label,sub,kind='house'){
 const g=new THREE.Group();g.position.set(x,0,z);world.add(g);const wall=mat(wallColor),roof=mat(roofColor);cube(w,7,d,wall,g,0,3.5,0);cube(w+.7,.35,d+.7,M.wood,g,0,7,0);
 const roofObj=triangleRoof(w+2,d+2,3.3,roof,g);roofObj.position.y=7.2;
 for(const s of [-1,1]){const win=cube(2.1,2.1,.12,M.window,g,s*(w*.28),3.9,d/2+.12);cube(2.3,.25,.25,M.wood,g,s*w*.28,5.15,d/2+.16);cube(.25,2.3,.25,M.wood,g,s*w*.28-1.1,3.9,d/2+.18)}
 cube(2.3,3.4,.2,M.wood,g,0,1.7,d/2+.19);ball(.13,M.window,g,.72,1.7,d/2+.34);
 panel(Math.min(w+2,12),3.2,signTexture(label,sub),g,0,9.3,d/2+.9);houses.push({g,x,z,w,d,kind});return g;
}
house(-26,-23,18,13,0xc9a5a6,0x55496b,'CORA LAB','AI + SIMULATIONS');
house(27,-23,18,13,0xb2b9a3,0x665475,'SAGEAI','HACKATHON WINNER');
house(-28,8,18,12,0xafafb4,0x565b74,'CODE WORKS','C++ / SYSTEMS');
house(27,7,18,12,0xc6a6ac,0x5a536e,'EXPERIENCE','QUALCOMM · CEREBRAS');
house(-26,42,17,10,0xc0b8a5,0x6c5565,'MEMORY LAB','LOW-LEVEL C');
house(29,42,17,10,0xb6bdba,0x595d79,'GITHUB HUB','BUILT & SHARED');
// Plaza arch, lighted torii-style sign, decorative seating and flower beds.
for(const x of [-5,5])cube(.95,9,1.2,mat(0x9d657b),world,x,4.2,-6);
cube(13.4,1.15,2.4,mat(0x61536f),world,0,9,-6);cube(14.5,.45,2.6,M.pink,world,0,9.65,-6);
panel(11,3.4,signTexture('NEON PLAZA','START HERE'),world,0,6.85,-4.7);
for(let i=0;i<6;i++){const x=-10+i*4.2,z=16+(i%2)*2;ball(.65,mat(i%2?0xe8a0b6:0xf1ca9d),world,x,.65,z);ball(.6,mat(0x8c9d79),world,x+.6,.5,z+.4)}
function tree(x,z,size=1){const g=new THREE.Group();g.position.set(x,0,z);world.add(g);cyl(.45*size,.68*size,3*size,mat(0x7d6368),g,0,1.4*size,0);for(let i=0;i<3;i++){const y=(3.5+i*1.3)*size;const geo=new THREE.ConeGeometry((3.4-i*.45)*size,3.8*size,7);mesh(geo,mat([0x486f65,0x5c8171,0x638978][i]),g,0,y,0)}return g}
for(let i=0;i<24;i++){let x=(rng()-.5)*106,z=(rng()-.5)*88;if(Math.abs(x)<9 || Math.abs(z-8)<10 || Math.abs(z+25)<8)continue;if(houses.some(h=>Math.abs(h.x-x)<h.w*.65+2&&Math.abs(h.z-z)<h.d*.8+3))continue;tree(x,z,.62+rng()*.43)}
for(let i=0;i<30;i++){let x=(rng()-.5)*108,z=(rng()-.5)*93;if(Math.abs(x)<7||Math.abs(z-8)<8)continue;ball(.16+rng()*.3,mat(rng()>.45?0xe8aab0:0xb1c8a7),world,x,.1,z)}
// lampposts cast small warm light halos; warm cyber-cozy aesthetic.
for(let x of [-47,-12,12,47])for(let z of [-8,19]){cyl(.18,.2,5,M.dark,world,x,2.5,z);cube(1.8,.25,1.8,M.wood,world,x,5.2,z);ball(.75,M.window,world,x,4.65,z);}
// Tram on an elevated rail at the far back of the island.
cube(112,.4,2.5,M.wood,world,0,5.3,-43);cube(112,.17,.16,M.teal,world,0,5.6,-42);for(let x=-50;x<=50;x+=16)cube(1,5,1,M.wood,world,x,2.6,-43);
const tram=new THREE.Group();world.add(tram);const tramBody=cube(16,3.6,4,mat(0x6c7c8c),tram,0,7,-43);cube(16,.45,4.2,M.pink,tram,0,9,-43);for(let x=-6;x<=6;x+=2.6)cube(1.6,1.5,.08,M.window,tram,x,7.3,-40.96);
// Hologram advertisements on roof corners.
const ads=[];
for(const h of houses.slice(0,4)){const g=h.g;const neon=new THREE.MeshBasicMaterial({color:0xff93b9,transparent:true,opacity:.47,side:THREE.DoubleSide});const back=mesh(new THREE.PlaneGeometry(7,2.5),neon,g,0,12.2,0);back.rotation.y=Math.PI/8;ads.push(back)}
// Pixel-art characters: original illustrations inspired by 90s anime city RPG aesthetics.
// Tiny canvas textures keep every sprite pixel-crisp and permit frame-by-frame animation.
const pixelPalettes={
 kenji:{hair:'#272036',hairBright:'#443854',jacket:'#478d91',jacketLight:'#75c1b8',trim:'#e8b56f',pants:'#232946',skin:'#ebbc9a',shoe:'#151a31',eye:'#202336',accent:'#e7a6ba'},
 talia:{hair:'#f49bb7',hairBright:'#ffd1d7',jacket:'#222339',jacketLight:'#4e4667',trim:'#f370a2',pants:'#171729',skin:'#efb59d',shoe:'#ec83aa',eye:'#42c7da',accent:'#f3a0c5'},
 d:{hair:'#18233c',hairBright:'#354762',jacket:'#285eab',jacketLight:'#658bce',trim:'#f5dfc4',pants:'#1a2546',skin:'#e5b394',shoe:'#12162b',eye:'#141e33',accent:'#60d6ee'},
 nova:{hair:'#946d64',hairBright:'#c19b8b',jacket:'#a6b674',jacketLight:'#d7dc9d',trim:'#f1c38e',pants:'#4c4960',skin:'#f2c3a1',shoe:'#2e2a37',eye:'#222536',accent:'#95e5d8'},
 yuki:{hair:'#7f5d94',hairBright:'#c69dcd',jacket:'#7055a5',jacketLight:'#c0a2d2',trim:'#ee9ac0',pants:'#36304e',skin:'#ebbc9c',shoe:'#252034',eye:'#241b38',accent:'#edc4e0'},
 milo:{hair:'#aa9178',hairBright:'#dbc6ab',jacket:'#739aa5',jacketLight:'#b3d4ce',trim:'#f2cfa0',pants:'#42475c',skin:'#e6b793',shoe:'#28283c',eye:'#222c39',accent:'#88d6e2'},
 ari:{hair:'#4c3840',hairBright:'#8e5761',jacket:'#cc817d',jacketLight:'#efad92',trim:'#f2d3a3',pants:'#584059',skin:'#f3c3a5',shoe:'#272037',eye:'#292333',accent:'#f4a8a1'}
};
function spriteFrame(style,step=0){
 const c=document.createElement('canvas');c.width=48;c.height=64;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const paint=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),w,h)};
 const dark='#151629',outline='#201c30',shadow='#35243a';
 const lean=step===1?-1:step===3?1:0,walk=step===1?2:step===3?-2:0;
 // broad stylized shadow at feet, rendered right into transparent sprite texture
 g.globalAlpha=.25;paint(10,60,28,3,'#201d35');g.globalAlpha=1;
 // chunky boots and denim legs with swinging feet
 paint(13+walk,47,9,12,outline);paint(26-walk,47,9,12,outline);
 paint(15+walk,48,6,9,style.pants);paint(28-walk,48,5,9,style.pants);
 paint(11+walk,57,13,4,dark);paint(26-walk,57,13,4,dark);
 paint(14+walk,57,8,2,style.shoe);paint(29-walk,57,8,2,style.shoe);
 // coat long silhouette with shoulders and folded cuffs
 paint(9+lean,31,31,20,outline);paint(11+lean,33,27,17,style.jacket);
 paint(9+lean,34,7,14,style.jacketLight);paint(33+lean,34,7,14,style.jacketLight);
 paint(10+lean,46,7,5,style.jacket);paint(32+lean,46,7,5,style.jacket);
 paint(17+lean,32,15,3,style.trim);paint(22+lean,34,5,14,style.trim);
 paint(15+lean,36,4,13,style.jacketLight);paint(30+lean,36,4,13,style.jacketLight);
 paint(11+lean,44,5,3,outline);paint(34+lean,44,5,3,outline);
 // neck and oversized face with detailed hair highlights
 paint(20+lean,28,9,6,style.skin);
 paint(13+lean,13,24,20,outline);paint(15+lean,15,20,17,style.skin);
 paint(17+lean,28,16,3,'#d9948c');
 paint(11+lean,8,27,13,style.hair);paint(12+lean,12,5,14,style.hair);
 paint(34+lean,11,5,15,style.hair);paint(16+lean,7,18,5,style.hair);
 paint(17+lean,9,17,3,style.hairBright);paint(13+lean,17,5,4,style.hairBright);
 paint(22+lean,12,6,12,style.hair);paint(23+lean,14,3,9,style.hairBright);
 // eyes, expression, cheek highlights
 paint(18+lean,23,4,3,style.eye);paint(29+lean,23,4,3,style.eye);
 paint(19+lean,23,1,1,'#ffffff');paint(30+lean,23,1,1,'#ffffff');
 paint(22+lean,29,4,1,'#a26570');
 paint(16+lean,27,2,1,'#ef989b');paint(33+lean,27,2,1,'#ef989b');
 // cyber accent: collar, earrings, badges / shoulder light
 paint(12+lean,34,2,4,style.accent);paint(37+lean,34,2,4,style.accent);
 paint(26+lean,38,3,3,style.accent);paint(27+lean,39,1,1,'#ffffff');
 if(style===pixelPalettes.talia){
   // pink asymmetric bob, long side-lock, dark half-mask
   paint(9+lean,11,8,20,style.hair);paint(37+lean,11,4,25,style.hair);
   paint(12+lean,29,10,4,style.hairBright);paint(19+lean,28,13,5,outline);
   paint(18+lean,23,15,4,'#27263c');paint(30+lean,23,3,2,'#57d4df');
 } else if(style===pixelPalettes.d){
   // tousled dark hair and oversized electric-blue collar
   paint(12+lean,5,8,8,style.hair);paint(22+lean,4,7,8,style.hair);
   paint(32+lean,6,7,8,style.hair);paint(12+lean,30,9,7,style.jacketLight);
   paint(30+lean,30,9,7,style.jacketLight);
 }
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;
 return texture;
}
const sheets=new Map();function pixelHero(kind){const style=pixelPalettes[kind]||pixelPalettes.nova;if(!sheets.has(kind))sheets.set(kind,[0,1,2,3].map(k=>spriteFrame(style,k)));const material=new THREE.SpriteMaterial({map:sheets.get(kind)[0],transparent:true,alphaTest:.05,depthWrite:false});const sprite=new THREE.Sprite(material);sprite.scale.set(4.8,6.4,1);sprite.center.set(.5,0);const root=new THREE.Group();root.add(sprite);root.userData.sprite=sprite;root.userData.frames=sheets.get(kind);root.userData.kind=kind;root.userData.lastStep=-1;return root}
function setSpriteWalk(root,time,moving){const k=moving?Math.floor(time*8)%4:0;if(k!==root.userData.lastStep){root.userData.sprite.material.map=root.userData.frames[k];root.userData.sprite.material.needsUpdate=true;root.userData.lastStep=k;}}
const player=pixelHero('kenji');world.add(player);player.position.set(0,0,4);
const npcs=[];
function npc(name,x,z,kind,radius=2.8){const g=pixelHero(kind);world.add(g);g.position.set(x,0,z);npcs.push({name,g,x,z,radius,seed:rng()*6.28,speed:.26+rng()*.18});return g}
npc('Talia',10,-13,'talia');npc('D',-12,10,'d');npc('Nova',11,23,'nova');npc('Yuki',-10,-2,'yuki');npc('Milo',40,-2,'milo');npc('Ari',-42,27,'ari');
function pet(x,z,c){const g=new THREE.Group();world.add(g);g.position.set(x,0,z);const fur=mat(c);const body=ball(.58,fur,g,0,.6,0);body.scale.set(1,.68,1.4);ball(.43,fur,g,0,.9,.47);for(const s of [-1,1]){mesh(new THREE.ConeGeometry(.19,.5,4),fur,g,s*.25,1.3,.5);ball(.065,M.dark,g,s*.17,.95,.84)}return g}
const pets=[pet(9,15,0xc7a381),pet(-9,26,0xc6bfd8)];
// Six destinations; physically reachable by walking, searchable from project pop-ups.
const places=[
{id:'cora',name:'CORA / ACE Studio',kicker:'CAPSTONE · UNIVERSITY OF TORONTO',symbol:'▤',x:-26,z:-12,description:'I led software development for a five-person team building an AI-assisted infrastructure cost estimator. Our Python-based application uses structured requirements and 10,000-trial Monte Carlo simulations to explore cost uncertainty.',tags:['Python','Streamlit','Simulation'],url:'index.html#projects'},
{id:'sage',name:'SageAI Studio',kicker:'WINNER · BEST AI IN HEALTHCARE',symbol:'✚',x:27,z:-12,description:'An award-winning hackathon prototype exploring AI-assisted healthcare through text and image inputs. I helped lead the software build and model integration.',tags:['AI','Hackathon','Product'],url:'https://devpost.com/software/sageai'},
{id:'gis',name:'Code Workshop',kicker:'PROJECT · ALGORITHMS',symbol:'⌘',x:-28,z:17,description:'A C++ route-finding engine that finds paths through road networks across 30+ cities with A* and Dijkstra’s algorithms, with benchmarked route calculations improved by 40%.',tags:['C++','Graph Algorithms','GIS'],url:'index.html#projects'},
{id:'experience',name:'Experience House',kicker:'SOFTWARE ENGINEERING · CAREER',symbol:'▣',x:27,z:17,description:'From Qualcomm automotive and data center software to developing a full C++ debugging application at Cerebras, I enjoy making complex engineering systems easier to use and more reliable.',tags:['Qualcomm','Cerebras','Systems'],url:'index.html#experience'},
{id:'memory',name:'Memory Lab',kicker:'PROJECT · SYSTEMS PROGRAMMING',symbol:'▦',x:-26,z:33,description:'A custom C memory allocator for allocating, freeing, and resizing heap memory, tested for correctness, speed, and space efficiency.',tags:['C','Memory','Performance'],url:'index.html#projects'},
{id:'github',name:'GitHub Station',kicker:'PROJECTS · GET IN TOUCH',symbol:'⌁',x:29,z:33,description:'Visit my GitHub to see public projects and experiments, or jump back to the main portfolio to learn more about my work.',tags:['GitHub','Portfolio','Code'],url:'https://github.com/kukenji'},
{id:'talia',name:'Talia, the Neon Courier',kicker:'LOCAL RESIDENT · STORY',symbol:'✿',description:'“The city is full of shortcuts, but the best ones start when you actually take the first step.” Talia delivers ideas across the district.',tags:['Meet Talia','Explorer']},
{id:'d',name:'D, the Street Runner',kicker:'LOCAL RESIDENT · STORY',symbol:'✦',description:'“You can plan forever, or you can start building.” D likes late-night engineering sessions and the glow of the tram.',tags:['Meet D','Builder']}
];
// Landmarks have floating glitter icons placed in-world + animated HTML overlays.
const markerEl=document.createElement('div');markerEl.id='markers';markerEl.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:3;overflow:hidden';container.parentElement.appendChild(markerEl);
const markers=places.slice(0,6).map(p=>{const el=document.createElement('button');el.className='spark';el.title=p.name;el.innerHTML='✦';el.style.cssText='position:absolute;border:2px solid #fff4d0;background:#dc8eac;color:#fff;box-shadow:0 3px 0 #8d5e78,0 0 18px #ffd39d;pointer-events:auto;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:17px;transform:translate(-50%,-50%);';el.addEventListener('click',()=>openPlace(p));markerEl.append(el);return {p,el}});
// Original procedural lo-fi night-city audio. No external music files, no autoplay.
const soundState={ctx:null,music:false,step:0,notesAt:0,ambientGain:null,mute:true};
const scale=[0,3,7,10,12,10,7,3];
function initAudio(){if(soundState.ctx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const ctx=new AC();soundState.ctx=ctx;const master=ctx.createGain();master.gain.value=.20;master.connect(ctx.destination);soundState.ambientGain=master}
function tone(freq,duration=.15,type='sine',vol=.10,delay=0){const ctx=soundState.ctx;if(!ctx||soundState.mute)return;const start=ctx.currentTime+delay;const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,start);g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),start+.015);g.gain.exponentialRampToValueAtTime(.0001,start+duration);o.connect(g);g.connect(soundState.ambientGain);o.start(start);o.stop(start+duration+.025)}
function playSfx(kind='click'){if(soundState.mute)return;initAudio();if(kind==='discover'){tone(660,.12,'triangle',.12);tone(880,.22,'sine',.08,.09);tone(1320,.28,'sine',.06,.2)}else if(kind==='step'){tone(110,.045,'triangle',.016)}else{tone(390,.09,'triangle',.08);tone(580,.09,'sine',.04,.06)}}
function toggleSound(){initAudio();if(!soundState.ctx){$('#soundButton').textContent='Audio unavailable';return}soundState.ctx.resume();soundState.mute=!soundState.mute;soundState.music=!soundState.mute;$('#soundButton').textContent=soundState.mute?'♫ Sound off':'♫ Sound on';$('#soundButton').setAttribute('aria-pressed',String(!soundState.mute));if(!soundState.mute){soundState.notesAt=soundState.ctx.currentTime+.05;playSfx('discover')}}
$('#soundButton').addEventListener('click',toggleSound);
function audioTick(){if(!soundState.ctx||!soundState.music)return;const ctx=soundState.ctx;while(soundState.notesAt<ctx.currentTime+.12){const i=soundState.step++,step=i%16;const root=[48,44,41,46][Math.floor(i/16)%4];const f=440*Math.pow(2,(root-69)/12);if(step%4===0){tone(f,.75,'triangle',.07,Math.max(0,soundState.notesAt-ctx.currentTime));tone(f*1.498,.66,'sine',.035,Math.max(0,soundState.notesAt-ctx.currentTime))}if(step%2===0){const m=f*2*Math.pow(2,scale[(i/2|0)%scale.length]/12);tone(m,.20,'sine',.045,Math.max(0,soundState.notesAt-ctx.currentTime))}soundState.notesAt+=.24}}
let found=new Set(),active=null,modalOpen=false,night=false,mapVisible=true;
function openPlace(p){playSfx('discover');active=p;modalOpen=true;$('#dialogKicker').textContent=p.kicker;$('#dialogSymbol').textContent=p.symbol;$('#dialogTitle').textContent=p.name;$('#dialogText').textContent=p.description;$('#dialogTags').replaceChildren(...p.tags.map(x=>{const t=document.createElement('span');t.textContent=x;return t}));const a=$('#dialogLink');a.hidden=!p.url;if(p.url)a.href=p.url;$('#modal').hidden=false;if(!found.has(p.id)&&places.slice(0,6).includes(p)){found.add(p.id);$('#progress').textContent=`${found.size} / 6`;$('#progressFill').style.width=`${found.size/6*100}%`}}
function closePlace(){modalOpen=false;$('#modal').hidden=true}$('#closeDialog').onclick=closePlace;$('#dialogDone').onclick=closePlace;$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closePlace()});
$('#helpButton').onclick=()=>openPlace({name:'How to Explore',kicker:'CONTROLS · WELCOME',symbol:'?',description:'Move with WASD or the arrow keys. Hold Shift to run. Walk close to a glowing star or resident and press E to interact. Press M to hide or show the map. On mobile use the on-screen directional buttons.',tags:['WASD','Shift','E Interact','M Map']});
$('#mapToggle').onclick=toggleMap;function toggleMap(){mapVisible=!mapVisible;$('.left-hud').style.display=mapVisible?'':'none'};
$('#themeButton').onclick=()=>{night=!night;scene.background.set(night?'#514665':'#b9a7a8');scene.fog.color.set(night?'#514665':'#b9a7a8');sun.intensity=night?1.8:4.3;hemi.intensity=night?2.2:3;renderer.toneMappingExposure=night?1.35:1.6;$('#themeButton').textContent=night?'☀':'☾'};
const keys=new Set();window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift','e','m','escape'].includes(k))e.preventDefault();keys.add(k);if(k==='e'&&!e.repeat&&closest)openPlace(closest);if(k==='m'&&!e.repeat)toggleMap();if(k==='escape')closePlace()});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());let mobile={up:false,down:false,left:false,right:false};document.querySelectorAll('[data-move]').forEach(b=>{const d=b.dataset.move;b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);mobile[d]=true};b.onpointerup=b.onpointercancel=()=>mobile[d]=false});$('#touchInteract').onclick=()=>closest&&openPlace(closest);
function resize(){const r=container.getBoundingClientRect();renderer.setSize(r.width,r.height,false);const ratio=r.width/Math.max(r.height,1);camera.left=-26*ratio;camera.right=26*ratio;camera.top=26;camera.bottom=-26;camera.updateProjectionMatrix()}resize();window.addEventListener('resize',resize);
camera.position.set(39,51,62);camera.lookAt(0,0,4);
const clock=new THREE.Clock(),look=new THREE.Vector3(),target=new THREE.Vector3();let closest=null,walking=0,zoneLast='',floatClock=0,lastFootstep=0;
function isBlocked(x,z){if(x<-52||x>52||z<-46||z>45)return true;for(const h of houses){if(Math.abs(x-h.x)<h.w/2+1.3&&Math.abs(z-h.z)<h.d/2+1.3)return true}return false}
function tick(){requestAnimationFrame(tick);const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;floatClock+=dt;audioTick();
 for(const n of npcs){const a=t*n.speed+n.seed;n.g.position.set(n.x+Math.sin(a)*n.radius,Math.abs(Math.sin(t*6+n.seed))*.045,n.z+Math.cos(a)*n.radius);setSpriteWalk(n.g,t+n.seed,true)}
 pets.forEach((p,i)=>{p.position.x=(i? -9:9)+Math.sin(t*.5+i)*2;p.position.z=(i?26:15)+Math.cos(t*.5+i)*1.2});tram.position.x=((t*6+80)%165)-82;ads.forEach((a,i)=>{a.material.opacity=.43+.2*Math.sin(t*2+i)});
 const right=Number(keys.has('d')||keys.has('arrowright')||mobile.right)-Number(keys.has('a')||keys.has('arrowleft')||mobile.left);const down=Number(keys.has('s')||keys.has('arrowdown')||mobile.down)-Number(keys.has('w')||keys.has('arrowup')||mobile.up);
 if(!modalOpen&&(right||down)){const length=Math.hypot(right,down)||1;const speed=keys.has('shift')?13:7.4;const vx=right/length*speed*dt,vz=down/length*speed*dt; // screen-aligned direction projected into isometric world
 const mx=(vx+vz)*.72,mz=(vz-vx)*.72;
 if(!isBlocked(player.position.x+mx,player.position.z))player.position.x+=mx;
 if(!isBlocked(player.position.x,player.position.z+mz))player.position.z+=mz;
 walking+=dt;if(walking-lastFootstep>.34){lastFootstep=walking;playSfx('step')}setSpriteWalk(player,walking,true);player.position.y=Math.abs(Math.sin(walking*10))*.035;
 }else{setSpriteWalk(player,walking,false);player.position.y*=.78}
 target.copy(player.position).add(new THREE.Vector3(39,51,58));camera.position.lerp(target,Math.min(1,dt*2.3));look.set(player.position.x,0,player.position.z);camera.lookAt(look);
 let min=5.8;closest=null;for(const p of places){const pos=p.id==='talia'||p.id==='d'?npcs.find(n=>n.name.toLowerCase()===p.id)?.g.position:new THREE.Vector3(p.x,0,p.z);if(!pos)continue;const dist=Math.hypot(player.position.x-pos.x,player.position.z-pos.z);if(dist<min){min=dist;closest=p}}
 $('#interactionPrompt').hidden=!closest||modalOpen;if(closest)$('#promptName').textContent=closest.name;let zone=closest?closest.name:'Neon Plaza';if(zone!==zoneLast){zoneLast=zone;$('#zoneCaption').querySelector('strong').textContent=zone;$('#zoneCaption').querySelector('small').textContent=closest?'Press E to explore':'A tiny city with big ideas'}
 const mapX=THREE.MathUtils.clamp((player.position.x+52)/104*100,5,95),mapY=THREE.MathUtils.clamp((player.position.z+46)/91*100,5,95);$('#mapPlayer').style.left=mapX+'%';$('#mapPlayer').style.top=mapY+'%';
 for(const {p,el} of markers){const v=new THREE.Vector3(p.x,11,p.z).project(camera);const bounds=container.getBoundingClientRect();el.style.left=((v.x+1)/2*100)+'%';el.style.top=((1-v.y)/2*100)+'%';el.style.display=Math.abs(v.x)>1||Math.abs(v.y)>1?'none':'block';el.style.opacity=found.has(p.id)?'.55':'1';el.style.transform=`translate(-50%,-50%) scale(${1+Math.sin(t*2+p.x)*.08})`}
 renderer.render(scene,camera)}
$('#loading').classList.add('hidden');tick();
