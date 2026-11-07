/* CAPRI v5 — original front-facing cyber-zen village. No external JS or audio dependencies. */
(() => {
'use strict';
const canvas=document.getElementById('scene'), ctx=canvas.getContext('2d',{alpha:false});
const W=1200,H=700;let rainEnabled=true,soundEnabled=false,modalOpen=false,last=performance.now(),time=0;
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=(seed)=>{let s=seed|0;return()=>((s=Math.imul(1664525,s)+1013904223|0)>>>0)/4294967296};
const random=rnd(70189);
const player={x:600,y:571,dir:1,moving:false,step:0};
const keys=new Set(),pointerKeys=new Set();let focusNear=null,hoverId=null;
const visited=new Set();
const items=[
 {id:'projects',x:285,y:430,range:104,name:'Project Workshop',icon:'✦',eyebrow:'BUILDING / PROJECTS',text:'Welcome to the workshop! Every shelf holds something I have built or learned from — from data and AI to algorithms and memory management.',tags:['Python','C++','C','Algorithms'],links:[['View selected projects','index.html#projects'],['SageAI · Hackathon Winner','https://devpost.com/software/sageai'],['Portfolio projects','index.html#projects']]},
 {id:'experience',x:885,y:425,range:108,name:'Experience House',icon:'◈',eyebrow:'BUILDING / EXPERIENCE',text:'I build systems software at Qualcomm, working on data-center validation and simulation components. Previously, I was the primary developer of a C++ debugging application at Cerebras, and contributed to automotive systems software at Qualcomm.',tags:['Qualcomm','Cerebras','C++','Python'],links:[['Experience timeline','index.html#experience'],['LinkedIn','https://www.linkedin.com/in/kenji-ku/']]},
 {id:'shrine',x:598,y:365,range:95,name:'Shrine of Wins',icon:'❀',eyebrow:'LANDMARK / HONORS',text:'A little reminder that progress comes from trying. University of Toronto · BASc Computer Engineering with Honours, Dean’s Honour List, and Best AI in Healthcare at GenAI Genesis for SageAI.',tags:['U of T','Honours','Hackathon'],links:[['SageAI on Devpost','https://devpost.com/software/sageai']]},
 {id:'contact',x:1031,y:535,range:85,name:'Contact Station',icon:'↗',eyebrow:'LANDMARK / CONTACT',text:'Thanks for visiting my little world! I’m always happy to meet engineers, swap ideas, and talk about fun software projects.',tags:['Toronto','Software Engineer'],links:[['Email Kenji','mailto:kenji270403@gmail.com'],['LinkedIn','https://www.linkedin.com/in/kenji-ku/'],['GitHub','https://github.com/kukenji'],['Classic portfolio','index.html']]},
 {id:'talia',x:468,y:514,range:80,name:'Talia',icon:'♡',eyebrow:'RESIDENT / GARDEN COURIER',text:'“You made it through the rain! Welcome to Komorebi District. I help keep the little town connected — and I know where all the interesting projects are hiding. Try the workshop on the left!”',tags:['Garden courier','Original NPC'],links:[['Explore projects','index.html#projects']]},
 {id:'d',x:780,y:516,range:80,name:'D',icon:'★',eyebrow:'RESIDENT / NIGHT RUNNER',text:'“Hey, newcomer. Out here, the best builds start with curiosity. I’d check the Experience House if you want to see the engineering behind the scenes.”',tags:['Night runner','Original NPC'],links:[['Engineering experience','index.html#experience']]},
 {id:'gis',x:240,y:515,range:75,name:'GIS Route Engine',icon:'⌘',eyebrow:'PROJECT / PATHFINDING',text:'A C++ navigation engine for street networks across 30+ cities using A* and Dijkstra’s algorithms, with a benchmarked 40% improvement in route-search speed.',tags:['C++','A*','Dijkstra'],links:[['Projects','index.html#projects']]},
 {id:'memory',x:956,y:500,range:75,name:'Memory Allocator',icon:'▦',eyebrow:'PROJECT / SYSTEMS',text:'A custom allocator written in C, implementing allocation, deallocation and resizing with 16-byte alignment, then testing correctness, speed, and memory utilization.',tags:['C','Heap memory','Performance'],links:[['Projects','index.html#projects']]}
];
const npcs=[
 {id:'talia',x:468,y:514,baseX:468,baseY:514,seed:2,walk:true,role:'talia'},
 {id:'d',x:780,y:516,baseX:780,baseY:516,seed:3,walk:true,role:'d'},
 {id:'resident1',x:160,y:579,baseX:160,baseY:579,seed:5,walk:true,role:'resident1'},
 {id:'resident2',x:1025,y:603,baseX:1025,baseY:603,seed:8,walk:true,role:'resident2'},
 {id:'resident3',x:695,y:612,baseX:695,baseY:612,seed:12,walk:true,role:'resident3'}
];
const rain=Array.from({length:145},()=>({x:random()*W,y:random()*H,speed:135+random()*235,len:9+random()*17,alpha:.08+random()*.21}));
const fireflies=Array.from({length:42},()=>({x:random()*W,y:275+random()*390,r:1+random()*2,phase:random()*6.28}));
const petals=Array.from({length:27},()=>({x:random()*W,y:280+random()*390,speed:6+random()*15,phase:random()*6.28}));
const palette={sky:'#242c44',wood:'#3e3340',paper:'#ead4ba',roof:'#33364e',pink:'#f3a5ad',mint:'#90e8d7',gold:'#f3c99b'};
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h)}
function poly(points,fill,stroke=null,line=1){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke()}}
function line(points,color,width=1){ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
function roundRect(x,y,w,h,r,color,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.6;ctx.stroke()}}
function glow(x,y,r,color,alpha=.38){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color.replace('ALPHA',String(alpha)));g.addColorStop(1,color.replace('ALPHA','0'));ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
function text(str,x,y,size,color,align='center',font='sans-serif'){ctx.font=`${size}px ${font}`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(str,x,y)}
function scenery(){
 // Night-to-rose sky, blurred horizon and soft moon
 const sky=ctx.createLinearGradient(0,0,0,550);sky.addColorStop(0,'#18243d');sky.addColorStop(.55,'#5a4964');sky.addColorStop(1,'#b88381');rect(0,0,W,H,sky);
 glow(906,112,150,'rgba(245,209,183,ALPHA)',.22);ellipse(907,112,40,40,'#f2ddd0');ellipse(925,102,34,35,'#e6cad1');
 const far=[[0,292],[80,248],[145,270],[243,212],[330,280],[405,233],[495,280],[584,220],[676,264],[759,218],[870,270],[957,228],[1021,263],[1120,205],[1200,262],[1200,495],[0,495]];poly(far,'#323f55');
 const near=[[0,341],[83,313],[158,329],[250,295],[340,342],[455,300],[567,351],[664,286],[782,338],[850,301],[949,349],[1052,286],[1200,338],[1200,470],[0,470]];poly(near,'#37444d');
 for(let i=0;i<24;i++){let x=i*61+14;ellipse(x,353+(i%4)*8,48,64,'#354d50');ellipse(x+14,337+(i%3)*7,28,51,'#48605b')}
 // ground and soft stone plaza
 rect(0,383,1200,317,'#455556');poly([[0,470],[1200,445],[1200,700],[0,700]],'#465352');
 poly([[433,460],[753,455],[1140,700],[30,700]],'#7d7a79');
 poly([[443,461],[743,460],[1090,700],[85,700]],'#9c9290');
 const p=rnd(123);for(let i=0;i<245;i++){let y=466+p()*238,x=p()*1200;let left=445-(y-460)*1.6,right=755+(y-460)*1.6;if(x>left&&x<right){ellipse(x,y,1+p()*2,.8,'#c5b1a33c')}}
 for(let y=478;y<710;y+=28){let rel=(y-450)*1.68;line([[480-rel,y],[720+rel,y]],'#857f8055',1.2)}
 // river and koi pond
 const water=ctx.createLinearGradient(0,493,0,675);water.addColorStop(0,'#416572');water.addColorStop(.5,'#517b80');water.addColorStop(1,'#294c62');poly([[0,508],[185,504],[321,537],[399,556],[450,588],[0,674]],water);poly([[846,568],[915,539],[1021,519],[1200,529],[1200,700],[1000,685]],water);
 for(let i=0;i<37;i++){let x=i*37+(i%2)*8,y=524+(i%6)*19;line([[x,y],[x+16,y]],'#c6dcd089',1.7);let a=970+(i%6)*42,b=565+(i%9)*13;line([[a,b],[a+24,b]],'#d5d4c775',1.5)}
 // foreground vegetation / stone islands
 for(let i=0;i<31;i++){let x=(i*91)%1200,y=475+(i%6)*35;const r=8+(i%4)*4;if((x>420&&x<800)&&y>530)continue;ellipse(x,y,r,r*.42,'#3a5550');ellipse(x-3,y-3,r*.76,r*.32,'#6c7f68')}
 for(let i=0;i<36;i++){let x=(i*67+19)%1200,y=482+(i%8)*31;if(x>415&&x<792)continue;line([[x,y+13],[x-3,y-8]],'#2f6253',2);line([[x,y+13],[x+4,y-5]],'#4a7960',2);ellipse(x-2,y-8,3,5,'#789678')}
 // koi fish
 for(const [i,x,y] of [[0,112,584],[1,1050,610],[2,1133,641]]){let dx=Math.sin(time*.55+i)*12,dy=Math.cos(time*.44+i)*5;ellipse(x+dx,y+dy,8,4,i===1?'#f6d9c1':'#e5a78a');poly([[x+dx-9,y+dy],[x+dx-15,y+dy-5],[x+dx-15,y+dy+5]],'#f0c5a8')}
 drawBridge();drawShrine();drawHouse(34,236,335,'WORKSHOP','PROJECTS','#a9d4be');drawHouse(780,233,340,'EXPERIENCE','HOUSE','#d6b8e2');drawGate(1030,424);drawGarden();drawLanterns();drawNeonSigns();
 // soft vignette
 const vig=ctx.createRadialGradient(600,340,100,600,340,790);vig.addColorStop(0,'#00000000');vig.addColorStop(1,'#0c132551');ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
}
function drawHouse(x,y,w,title,subtitle,accent){
 let h=198;ctx.save();ctx.shadowColor='#0e162c';ctx.shadowBlur=24;ctx.shadowOffsetY=14;roundRect(x+19,y+70,w-36,h-48,7,'#755b5b');ctx.restore();
 rect(x+32,y+88,w-62,h-68,'#d6c0a7');rect(x+38,y+93,w-74,h-76,'#baa49a');
 for(let a=0;a<5;a++){rect(x+39+a*(w-82)/5,y+94,3,142,'#624c51')}
 poly([[x-5,y+82],[x+35,y+13],[x+w/2,y-24],[x+w-28,y+13],[x+w+14,y+82]],'#292d42','#12182d',5);
 poly([[x+22,y+62],[x+w/2,y+4],[x+w-8,y+62]],'#4b4a5d');
 for(let a=0;a<9;a++){let xx=x+a*w/9;line([[xx,y+71],[x+w/2+(xx-(x+w/2))*.77,y+17]],'#212a40',2)}
 rect(x-2,y+71,w+9,13,'#a07872');rect(x-1,y+77,w+5,5,'#e6b2a0');
 for(let k=0;k<2;k++){let wx=x+64+k*(w-150);roundRect(wx,y+116,59,70,3,'#473e4b','#b78d7b');rect(wx+8,y+124,43,52,'#c7bda2');line([[wx+29,y+125],[wx+29,y+176]],'#5c4853',3);line([[wx+8,y+151],[wx+51,y+151]],'#5c4853',3)}
 roundRect(x+w/2-31,y+134,61,111,3,'#473f4c','#d2b2a1');rect(x+w/2-23,y+144,46,93,'#a68b7f');rect(x+w/2-2,y+145,4,91,'#4b4151');ellipse(x+w/2+13,y+189,3,3,'#efe2bb');
 glow(x+w/2,y+94,95,'rgba(223,158,154,ALPHA)',.14);
 roundRect(x+w/2-91,y+66,182,39,6,'#25283e','#d9c3a5');text(title,x+w/2,y+88,16,accent);text(subtitle,x+w/2,y+101,8,'#d9c5c9');
 // awning and door lights
 for(let side of [-1,1]){let lx=x+w/2+side*100;line([[lx,y+98],[lx,y+129]],'#594450',3);glow(lx,y+140,35,'rgba(255,186,126,ALPHA)',.40);roundRect(lx-11,y+119,22,30,4,'#b8666a');roundRect(lx-7,y+123,14,22,2,'#f9c994')}
}
function drawShrine(){let x=598,y=289;
 // stone steps
 for(let i=3;i>=0;i--)roundRect(x-94-i*12,y+124+i*19,188+i*24,18,2,i%2?'#949292':'#a6a09b');
 rect(x-104,y+48,209,94,'#74535b');rect(x-85,y+68,169,72,'#bea68f');
 poly([[x-130,y+54],[x-85,y-8],[x,y-34],[x+89,y-8],[x+134,y+54]],'#4a3547','#251c32',5);
 poly([[x-93,y+39],[x,y-9],[x+95,y+39]],'#674d59');rect(x-133,y+48,266,10,'#d48e8e');
 rect(x-18,y+75,36,62,'#433b47');roundRect(x-22,y+64,44,20,3,'#f4d9ba');text('祈',x,y+80,15,'#784756');
 // torii on steps
 for(let k of [-1,1]){rect(x+k*102-7,y+18,14,124,'#ad6269');rect(x+k*102-8,y+20,16,11,'#e8ad95')}
 poly([[x-126,y+12],[x+128,y+12],[x+116,y+26],[x-116,y+26]],'#cb7775');rect(x-108,y+30,217,13,'#a85e6c');
 glow(x,y+16,120,'rgba(239,154,160,ALPHA)',.14);
 text('SHRINE OF WINS',x,y+6,12,'#f3d5cd');
}
function drawBridge(){
 // pedestrian bridge connecting river sections along front walkway
 poly([[385,573],[441,548],[489,550],[508,578],[508,611],[377,608]],'#574351');
 poly([[358,560],[418,526],[477,532],[513,557],[513,575],[476,550],[417,548],[358,581]],'#bb585e');
 line([[356,557],[412,514],[469,518],[513,555]],'#e99583',10);line([[356,579],[414,540],[474,544],[513,578]],'#df8e7b',7);
 for(let i=0;i<6;i++){let px=359+i*29,py=559-31*Math.sin(i/5*Math.PI);line([[px,py],[px,py+41]],'#8c4c55',7)}
 for(let i=0;i<9;i++){let x=374+i*16;line([[x,570],[x,595]],'#5f404d',1.5)}
}
function drawGate(x,y){
 rect(x-8,y-78,16,122,'#994e60');rect(x+72,y-78,16,122,'#994e60');rect(x-30,y-86,137,15,'#d57472');rect(x-24,y-109,125,17,'#cf827b');poly([[x-39,y-92],[x+114,y-92],[x+100,y-104],[x-23,y-104]],'#f0ae96');
 roundRect(x+5,y-53,67,29,2,'#303448','#dbb1a2');text('CONTACT',x+39,y-34,11,'#d7e8df');
}
function drawGarden(){
 // left zen sand, rocks, bonsai
 ellipse(101,454,95,40,'#a5a39b');for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(101,457,40+i*12,11+i*7,0,0,Math.PI*2);ctx.strokeStyle='#f1e1c24d';ctx.lineWidth=2;ctx.stroke()}
 for(const [x,y,r] of [[61,446,11],[106,440,15],[139,459,9]]){ellipse(x,y,r,r*.58,'#646d6f');ellipse(x-3,y-3,r*.7,r*.4,'#9fada3')}
 // cherry trees with glowing clusters
 tree(69,350,1.05);tree(1149,330,1.1);tree(746,347,.65);
 // bamboo grove on right
 for(let i=0;i<8;i++){let x=1130+i*12,y=470+i%2*5;rect(x,y-91-i%3*13,5,97+i%3*13,'#40635c');for(let q=0;q<4;q++){let h=y-25-q*18;line([[x+1,h],[x-15-q%2*3,h-14]],'#618a76',3);line([[x+2,h-7],[x+14,h-20]],'#78947b',3)}}
}
function tree(x,y,scale){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);line([[-9,82],[0,0],[5,-55]],'#544558',10);line([[0,15],[-43,-20]],'#604a5a',7);line([[0,-2],[51,-37]],'#604a5a',7);for(let i=0;i<12;i++){let a=i*2.399,r=28+(i%4)*12,bx=Math.cos(a)*r,by=-40+Math.sin(a)*r*.55;ellipse(bx,by,25,18,['#cd8f9b','#e1a7ae','#bd8698','#efb7b9'][i%4]);ellipse(bx-6,by-5,8,5,'#ffd5c8a0')}ctx.restore()}
function drawLanterns(){for(const [x,y] of [[182,475],[363,475],[820,473],[1105,509],[531,460],[667,461]]){
 line([[x,y-45],[x,y+6]],'#37394b',5);glow(x,y-46,58,'rgba(255,198,141,ALPHA)',.27);poly([[x-11,y-71],[x+11,y-71],[x+15,y-61],[x-15,y-61]],'#5f4052');roundRect(x-11,y-61,22,28,4,'#f6c6a1','#b06463');line([[x,y-61],[x,y-33]],'#bf7778',2);poly([[x-13,y-32],[x+13,y-32],[x+10,y-27],[x-10,y-27]],'#7b4b59')}
}
function drawNeonSigns(){
 for(const [x,y,a,b,col] of [[75,401,'CORA','AI + DATA','#94e6cb'],[283,372,'PROJECT','WORKSHOP','#edbbba'],[845,383,'QUALCOMM','CEREBRAS','#c4c5ff'],[1122,464,'KENJI','ONLINE','#a3d9da']]){
 glow(x,y,64,'rgba(132,226,225,ALPHA)',.12);roundRect(x-49,y-25,98,46,7,'#242c40cf',col);text(a,x,y-3,13,col);text(b,x,y+12,9,'#f5dece');}
}
function makeSprite(kind){let c=document.createElement('canvas');c.width=36;c.height=52;let g=c.getContext('2d');g.imageSmoothingEnabled=false;const block=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
 let colors={kenji:['#283348','#d7a181','#252332','#aebfd7'],talia:['#8b465f','#f2b6a3','#d9a5bc','#ea8e9e'],d:['#31516c','#c79273','#e5b67e','#83b7db'],resident1:['#59776b','#d1a88e','#4f4248','#f0cba2'],resident2:['#a07868','#e9b9a0','#7e5259','#e6b9d2'],resident3:['#666b9d','#d7aa91','#3d374c','#bcbbc7']}[kind];let [coat,skin,hair,accent]=colors||['#54686e','#d1a081','#403a44','#96cfce'];
 block(9,44,7,7,'#29273b');block(21,44,7,7,'#29273b');block(8,47,9,4,'#131d31');block(20,47,9,4,'#131d31');block(9,27,19,19,coat);block(6,30,4,11,coat);block(28,30,4,11,coat);block(12,30,13,6,accent);block(17,32,3,12,'#22253d');
 // oversized pixel head with hair + eyes
 block(8,8,21,21,'#392e3c');block(9,12,19,17,skin);block(7,5,23,12,hair);block(8,2,18,7,hair);block(5,12,5,12,hair);block(27,12,5,11,hair);
 if(kind==='talia'){block(5,11,5,25,'#c88da7');block(27,10,5,23,'#e3a1b8');block(11,6,17,4,'#f4bfd1');block(10,28,19,3,'#e4a3ae')}else if(kind==='d'){block(8,7,20,4,'#e4b483');block(23,9,7,9,'#e4b483');block(5,28,26,4,'#5284aa')}else{block(8,7,20,4,hair)}
 block(12,20,4,4,'#2d2b41');block(23,20,4,4,'#2d2b41');block(13,20,1,1,'#ffffff');block(24,20,1,1,'#ffffff');block(17,26,3,1,'#b16f6f');block(15,43,9,2,'#6b5060');return c;
}
const sprites={};for(const k of ['kenji','talia','d','resident1','resident2','resident3'])sprites[k]=makeSprite(k);
function drawPerson(p,isPlayer=false){let x=p.x,y=p.y;let bob=(p.moving||p.walk)?Math.sin(time*9+p.seed||0)*2:Math.sin(time*2+(p.seed||0))*.6;let scale=isPlayer?2.08:1.82;
 ellipse(x,y+3,22,7,'#131e3155');
 if(isPlayer){ctx.strokeStyle='#b5f0d3';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y+2,23,8,0,0,Math.PI*2);ctx.stroke()}
 let s=sprites[isPlayer?'kenji':p.role];ctx.save();ctx.translate(x,y-52*scale+bob);if(p.dir===-1){ctx.translate(36*scale,0);ctx.scale(-1,1)}ctx.imageSmoothingEnabled=false;ctx.drawImage(s,0,0,36*scale,52*scale);ctx.restore();
}
function drawLabel(x,y,name,near=false){const ww=Math.max(80,name.length*7+22);roundRect(x-ww/2,y-18,ww,29,7,near?'#e9c0a9':'#23283bdc',near?'#ffe3c4':'#ffffff4a');text(name,x,y+1,12,near?'#2d2940':'#f8eedf')}
function drawMarkers(){for(const item of items){if(item.id==='talia'||item.id==='d')continue;let near=Math.hypot(player.x-item.x,player.y-item.y)<item.range;let cy=item.y-50+Math.sin(time*1.8+item.x)*4;glow(item.x,cy,41,'rgba(255,197,156,ALPHA)',near?.34:.16);ellipse(item.x,cy,15,15,near?'#f8d4a4':'#bde5d9');text(item.icon,item.x,cy+6,20,'#394155')
 if(near||hoverId===item.id)drawLabel(item.x,cy-24,item.name,near)}}
function drawWeather(dt){if(!rainEnabled)return;ctx.save();ctx.lineWidth=1.3;for(const r of rain){r.y+=dt*r.speed;r.x-=dt*55;if(r.y>H+20){r.y=-25;r.x=random()*W}if(r.x<0)r.x=W;ctx.strokeStyle=`rgba(192,218,232,${r.alpha})`;line([[r.x,r.y],[r.x-5,r.y+r.len]],ctx.strokeStyle,1)}ctx.restore();for(let i=0;i<9;i++){let x=(((i*139)+Math.floor(time*26))%1200),y=565+i*16;ctx.strokeStyle='#d4e9e944';ctx.beginPath();ctx.ellipse(x,y,12+Math.sin(time*2+i)*3,3,0,0,Math.PI*2);ctx.stroke()}}
function drawParticles(dt){for(const f of fireflies){let a=.12+(Math.sin(time*1.6+f.phase)+1)*.20;glow(f.x+Math.sin(time*.9+f.phase)*8,f.y+Math.cos(time*.8+f.phase)*5,12,'rgba(255,219,166,ALPHA)',a);ellipse(f.x,f.y,f.r,'#f7d9a3a0')}for(const p of petals){p.y+=dt*p.speed;p.x+=Math.sin(time+p.phase)*dt*12;if(p.y>700){p.y=250;p.x=random()*1200}ellipse(p.x,p.y,3,1.7,'#eeb6bd99')}}
function drawScene(dt){scenery();drawParticles(dt);
 const actors=[...npcs,player].sort((a,b)=>a.y-b.y);for(const npc of actors)drawPerson(npc,npc===player);
 drawMarkers();drawWeather(dt);
}
function update(dt){time+=dt;const L=keys.has('a')||keys.has('arrowleft')||pointerKeys.has('left'),R=keys.has('d')||keys.has('arrowright')||pointerKeys.has('right'),U=keys.has('w')||keys.has('arrowup')||pointerKeys.has('up'),D=keys.has('s')||keys.has('arrowdown')||pointerKeys.has('down');let dx=Number(R)-Number(L),dy=Number(D)-Number(U),len=Math.hypot(dx,dy);player.moving=!!len;
 if(!modalOpen&&len){let speed=(keys.has('shift')?215:132)*dt;player.x=clamp(player.x+dx/len*speed,48,1150);player.y=clamp(player.y+dy/len*speed,468,650);if(dx)player.dir=dx>0?1:-1;player.step+=dt*9;if(soundEnabled&&player.step>1){player.step=0;audioFoot()}}
 for(const npc of npcs){let a=time*(npc.id==='talia'?.50:.38)+npc.seed;npc.x=npc.baseX+Math.sin(a)*17;npc.y=npc.baseY+Math.cos(a*.8)*9;npc.dir=Math.cos(a)>=0?1:-1}
 let cand=null,dist=Infinity;for(const item of items){let pos=item;if(item.id==='talia'||item.id==='d')pos=npcs.find(n=>n.id===item.id);let d=Math.hypot(player.x-pos.x,player.y-pos.y);if(d<item.range&&d<dist){cand=item;dist=d}}focusNear=cand;const hint=$('interactHint');hint.hidden=modalOpen||!cand;if(cand)$('nearbyName').textContent=cand.name;
}
function openItem(item){if(!item)return;modalOpen=true;keys.clear();pointerKeys.clear();visited.add(item.id);$('discoveries').textContent=visited.size+' / '+items.length;$('modalEyebrow').textContent=item.eyebrow;$('modalIcon').textContent=item.icon;$('modalTitle').textContent=item.name;$('modalText').textContent=item.text;$('modalTags').replaceChildren();for(const t of item.tags){let s=document.createElement('span');s.textContent=t;$('modalTags').append(s)}$('modalLinks').replaceChildren();for(const [label,href] of item.links){let a=document.createElement('a');a.textContent=label+' ↗';a.href=href;if(!href.startsWith('mailto:')&&!href.startsWith('index.html')){a.target='_blank';a.rel='noopener noreferrer'}$('modalLinks').append(a)}$('modal').hidden=false;$('sceneMessage').textContent='Discovered '+item.name+' ✦';audioPing()}
function closeModal(){modalOpen=false;$('modal').hidden=true}
$('modalClose').onclick=closeModal;$('modalContinue').onclick=closeModal;$('modal').addEventListener('click',e=>{if(e.target===$('modal'))closeModal()});$('interactHint').onclick=()=>openItem(focusNear);$('mobileInteract').onclick=()=>openItem(focusNear||items[0]);for(const b of document.querySelectorAll('[data-open]'))b.onclick=()=>openItem(items.find(i=>i.id===b.dataset.open));
$('helpButton').onclick=()=>openItem({name:'How to Explore',eyebrow:'YOUR FIELD GUIDE',icon:'⌘',text:'WASD or arrow keys to walk. Hold Shift to run. Press E when you approach a glowing project marker or resident. Click a landmark to jump straight to its story. Tap the on-screen controls on mobile. Turn sound and rain on or off anytime.',tags:['WASD','Shift','E','Click to discover'],links:[]});
$('rainButton').onclick=()=>{rainEnabled=!rainEnabled;$('rainButton').textContent=rainEnabled?'☂ Rain on':'☀ Rain off';$('rainButton').setAttribute('aria-pressed',String(rainEnabled));if(rainGain)rainGain.gain.setTargetAtTime(rainEnabled?.025:0,ac.currentTime,.3)};
addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowleft','arrowright','arrowup','arrowdown',' ','w','a','s','d','e','shift','escape'].includes(k))e.preventDefault();if(k==='escape')closeModal();if(k==='e'&&!modalOpen&&!e.repeat)openItem(focusNear);keys.add(k)});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>{keys.clear();pointerKeys.clear()});
for(const b of document.querySelectorAll('[data-direction]')){const k=b.dataset.direction;const down=e=>{e.preventDefault();pointerKeys.add(k);b.setPointerCapture(e.pointerId)};const up=e=>{e.preventDefault();pointerKeys.delete(k)};b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up)}
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;let closest=null,dist=999;for(let item of items){let pos=item.id==='talia'||item.id==='d'?npcs.find(n=>n.id===item.id):item;let d=Math.hypot(x-pos.x,y-(pos.y-30));if(d<72&&d<dist){closest=item;dist=d}}hoverId=closest?.id||null;canvas.style.cursor=closest?'pointer':'crosshair'});
canvas.addEventListener('click',e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;let closest=null,dist=999;for(let item of items){let pos=item.id==='talia'||item.id==='d'?npcs.find(n=>n.id===item.id):item;let d=Math.hypot(x-pos.x,y-(pos.y-30));if(d<85&&d<dist){closest=item;dist=d}}if(closest)openItem(closest)});
// Original, optional browser-synthesized ambient soundtrack. No copyrighted recordings.
let ac=null,musicInterval=null,noiseSource=null,rainGain=null,musicGain=null;function beep(freq,duration=.13,gain=.035,type='sine'){if(!ac||ac.state!=='running')return;const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(freq,ac.currentTime);g.gain.setValueAtTime(gain,ac.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+duration);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+duration)}
function audioPing(){if(soundEnabled){beep(659,.16,.04);setTimeout(()=>beep(880,.27,.03),85)}}function audioFoot(){if(soundEnabled&&Math.random()>.4)beep(130,.045,.006,'triangle')}
function startAudio(){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;ac=ac||new A();ac.resume();const sr=ac.sampleRate,b=ac.createBuffer(1,sr*2,sr),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.27;noiseSource=ac.createBufferSource();noiseSource.buffer=b;noiseSource.loop=true;const filter=ac.createBiquadFilter();filter.type='lowpass';filter.frequency.value=410;rainGain=ac.createGain();rainGain.gain.value=rainEnabled?.025:0;noiseSource.connect(filter).connect(rainGain).connect(ac.destination);noiseSource.start();const notes=[220,261.63,329.63,392,293.66,261.63,196,246.94];let index=0;const play=()=>{if(!soundEnabled)return;let f=notes[index%notes.length];beep(f,.8,.016,'sine');if(index%4===0)beep(f/2,1.1,.014,'triangle');index++};play();musicInterval=setInterval(play,630)}
function stopAudio(){if(musicInterval){clearInterval(musicInterval);musicInterval=null}if(noiseSource){try{noiseSource.stop()}catch{}noiseSource=null}if(ac)ac.suspend()}
$('soundButton').onclick=()=>{soundEnabled=!soundEnabled;$('soundButton').textContent=soundEnabled?'♫ Sound on':'♫ Sound off';$('soundButton').setAttribute('aria-pressed',String(soundEnabled));if(soundEnabled)startAudio();else stopAudio()};
function frame(now){let dt=Math.min((now-last)/1000,.04);last=now;if(!modalOpen)update(dt);drawScene(dt);requestAnimationFrame(frame)}requestAnimationFrame(frame);
})();
