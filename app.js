'use strict';
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg',fmt=n=>new Intl.NumberFormat('es-EC').format(n),pct=n=>new Intl.NumberFormat('es-EC',{maximumFractionDigits:1}).format(n);
let DATA,GEO,selected='',view='city',box,baseBox,drag=null,moved=false;
const fileUrl=path=>window.DASHBOARD_OFFLINE?.files[path]??path;
const presets={city:[-80.12,-2.30,-79.82,-1.98],center:[-79.923,-2.235,-79.867,-2.17],canton:[-80.60,-3.12,-79.58,-1.97]};
const project=([x,y])=>[(x+81)*1000,(-y-1.5)*1000];
const color=n=>n>=2000?'#174e87':n>=1000?'#2f77b8':n>=220?'#61a0d8':n>=50?'#a5cbed':'#e0edf8';
const flatten=g=>g.type==='Polygon'?g.coordinates:g.coordinates.flat();
function path(g){return flatten(g).map(r=>r.map((p,i)=>`${i?'L':'M'}${project(p).map(v=>v.toFixed(3)).join(',')}`).join('')+'Z').join('');}
function el(tag,attrs,parent){const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);parent?.append(e);return e;}
function makeBox(bounds){const a=project([bounds[0],bounds[3]]),b=project([bounds[2],bounds[1]]);let w=b[0]-a[0],h=b[1]-a[1],cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2;const ratio=$('mapStage').clientWidth/$('mapStage').clientHeight;if(w/h<ratio)w=h*ratio;else h=w/ratio;return[cx-w/2,cy-h/2,w,h];}
function setBox(next){box=next;$('map').setAttribute('viewBox',box.join(' '));renderLabels();}
function setView(name){view=name;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));baseBox=makeBox(presets[name]);setBox([...baseBox]);}
function featureBounds(f){const p=flatten(f.geometry).flat();return[Math.min(...p.map(x=>x[0])),Math.min(...p.map(x=>x[1])),Math.max(...p.map(x=>x[0])),Math.max(...p.map(x=>x[1]))];}
function fitParish(key){if(key==='GUAYAQUIL')return;if(key==='CHONGON'){setBox(makeBox([-80.13,-2.28,-80.025,-2.19]));return;}const f=GEO.parishes.features.find(f=>f.properties.key===key);if(!f)return;const b=featureBounds(f),p=Math.max(b[2]-b[0],b[3]-b[1])*.25;setBox(makeBox([b[0]-p,b[1]-p,b[2]+p,b[3]+p]));document.querySelectorAll('[data-view]').forEach(b=>b.classList.remove('active'));}
function tooltip(p,event){$('tooltip').replaceChildren();const t=document.createElement('strong');t.textContent=p.name;const s=document.createElement('span');s.textContent=`${fmt(p.count)} beneficiarios · ${pct(p.count/DATA.total*100)} % del total`;$('tooltip').append(t,s);$('tooltip').hidden=false;if(event){const r=$('mapStage').getBoundingClientRect();$('tooltip').style.left=Math.max(10,Math.min(event.clientX-r.left+14,r.width-240))+'px';$('tooltip').style.top=Math.max(10,Math.min(event.clientY-r.top+14,r.height-75))+'px';}}
function mapSelect(key){if(!moved)choose(selected===key?'':key,false);}
function buildMap(){for(const f of GEO.context)el('path',{d:path(f.geometry),class:'land'},$('context'));for(const f of GEO.parishes.features){const p=DATA.parishes.find(p=>p.key===f.properties.key);if(!p)continue;const shape=el('path',{d:path(f.geometry),fill:color(p.count),class:'parish-shape','data-key':p.key,tabindex:'0',role:'button','aria-label':`${p.name}: ${fmt(p.count)} beneficiarios`,'aria-pressed':'false'},$('areas'));el('title',{},shape).textContent=`${p.name} · ${fmt(p.count)}`;shape.addEventListener('pointermove',e=>{if(!drag)tooltip(p,e);});shape.addEventListener('pointerleave',()=>$('tooltip').hidden=true);shape.addEventListener('click',()=>mapSelect(p.key));shape.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(selected===p.key?'':p.key,false);}});shape.addEventListener('focus',()=>tooltip(p));shape.addEventListener('blur',()=>$('tooltip').hidden=true);}
 const g=el('g',{class:'chongon-marker',tabindex:'0',role:'button','data-key':'CHONGON','aria-label':'Chongón: 68 beneficiarios. Ubicación referencial, sin límite disponible.','aria-pressed':'false'},$('markers'));g.addEventListener('click',()=>mapSelect('CHONGON'));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose('CHONGON',false);}});g.addEventListener('pointermove',e=>tooltip(DATA.parishes.find(p=>p.key==='CHONGON'),e));g.addEventListener('pointerleave',()=>$('tooltip').hidden=true);
}
function renderLabels(){
 if(!GEO||!box)return;
 const root=$('labels');root.replaceChildren();
 const stage=$('mapStage').getBoundingClientRect(),width=stage.width,height=stage.height;
 // Work in screen pixels so text, padding and borders stay readable at every zoom.
 const scale=Math.max(box[2]/width,box[3]/height);
 const offsetX=(width-box[2]/scale)/2,offsetY=(height-box[3]/scale)/2;
 const toScreen=point=>{const[x,y]=project(point);return[(x-box[0])/scale+offsetX,(y-box[1])/scale+offsetY];};
 const layer=el('g',{transform:`translate(${box[0]-offsetX*scale} ${box[1]-offsetY*scale}) scale(${scale})`},root);
 const leaders=el('g',{class:'map-label-leaders'},layer),cards=el('g',{},layer);
 const measure=el('text',{class:'map-callout-name',visibility:'hidden'},layer);
 const textWidth=text=>{measure.textContent=text;return measure.getComputedTextLength();};
 const wrapName=name=>{
  const lines=[];let line='';
  for(const word of name.split(' ')){
   const candidate=line?line+' '+word:word;
   if(line&&textWidth(candidate)>122){lines.push(line);line=word;}else line=candidate;
  }
  if(line)lines.push(line);return lines;
 };
 const points=[];
 for(const f of GEO.parishes.features){
  const p=DATA.parishes.find(p=>p.key===f.properties.key),[x,y]=toScreen(f.properties.point);
  if(x<0||x>width||y<0||y>height)continue;
  const b=featureBounds(f),size=Math.max(b[2]-b[0],b[3]-b[1])*1000/scale;
  if(size<42&&p.key!==selected)continue;
  points.push({p,x,y,size});
 }
 const[chongonX,chongonY]=toScreen([-80.07812,-2.23718]);
 if(chongonX>=0&&chongonX<=width&&chongonY>=0&&chongonY<=height){
  points.push({p:DATA.parishes.find(p=>p.key==='CHONGON'),x:chongonX,y:chongonY,size:45,note:'Ubicación referencial'});
 }
 const marker=$('markers').firstElementChild;marker.replaceChildren();
 const[cx,cy]=project([-80.07812,-2.23718]);el('circle',{cx,cy,r:5*scale},marker);
 const used=[...document.querySelectorAll('.north,.map-zoom,.map-hint')].map(e=>{
  const r=e.getBoundingClientRect();return{x:r.left-stage.left,y:r.top-stage.top,w:r.width,h:r.height};
 });
 const intersects=(a,b)=>a.x<b.x+b.w+5&&a.x+a.w+5>b.x&&a.y<b.y+b.h+5&&a.y+a.h+5>b.y;
 const placements=[];
 points.sort((a,b)=>Number(b.p.key===selected)-Number(a.p.key===selected)||b.size-a.size);
 for(const item of points){
  const lines=wrapName(item.p.name),w=Math.ceil(Math.max(...lines.map(textWidth),textWidth(fmt(item.p.count)),item.note?textWidth(item.note):0))+14;
  const h=lines.length*13+26+(item.note?12:0),candidates=[[0,0]];
  for(let radius=28;radius<=224;radius+=24){
   for(let i=0;i<16;i++){const angle=i*Math.PI/8;candidates.push([Math.cos(angle)*radius,Math.sin(angle)*radius]);}
  }
  let best=null,bestScore=Infinity;
  for(const[dx,dy]of candidates){
   const r={x:Math.max(8,Math.min(width-w-8,item.x+dx-w/2)),y:Math.max(8,Math.min(height-h-8,item.y+dy-h/2)),w,h};
   if(used.some(other=>intersects(r,other)))continue;
   const score=(r.x+w/2-item.x)**2+(r.y+h/2-item.y)**2;
   if(score<bestScore){best=r;bestScore=score;}
  }
  if(!best)continue;
  used.push(best);placements.push({...item,...best,anchorX:item.x,anchorY:item.y,lines});
 }
 measure.remove();
 for(const p of placements){
  const edgeX=Math.max(p.x,Math.min(p.x+p.w,p.anchorX)),edgeY=Math.max(p.y,Math.min(p.y+p.h,p.anchorY));
  if(Math.hypot(edgeX-p.anchorX,edgeY-p.anchorY)>4){
   el('line',{x1:p.anchorX,y1:p.anchorY,x2:edgeX,y2:edgeY},leaders);
   el('circle',{cx:p.anchorX,cy:p.anchorY,r:2},leaders);
  }
  const card=el('g',{class:'map-callout'+(p.p.key===selected?' selected':''),'data-key':p.p.key},cards);
  el('rect',{x:p.x,y:p.y,width:p.w,height:p.h,rx:5},card);
  p.lines.forEach((line,i)=>{el('text',{x:p.x+p.w/2,y:p.y+15+i*13,class:'map-callout-name'},card).textContent=line;});
  el('text',{x:p.x+p.w/2,y:p.y+17+p.lines.length*13,class:'map-callout-count'},card).textContent=fmt(p.p.count);
  if(p.note)el('text',{x:p.x+p.w/2,y:p.y+p.h-6,class:'map-callout-note'},card).textContent=p.note;
  card.addEventListener('click',()=>mapSelect(p.p.key));
  card.addEventListener('pointermove',e=>{if(!drag)tooltip(p.p,e);});
  card.addEventListener('pointerleave',()=>$('tooltip').hidden=true);
 }
}
function choose(key,fit=false){selected=key;const p=DATA.parishes.find(x=>x.key===key),count=p?.count??DATA.total;$('parishSelect').value=key;$('selectedCount').textContent=fmt(count);$('selectedShare').textContent=`${pct(count/DATA.total*100)} % del total`;const a=$('downloadSelection');a.href=fileUrl(p?.file??'downloads/todos.xlsx');a.download=p?`beneficiarios-${p.file.split('/').pop()}`:'beneficiarios-guayaquil.xlsx';a.setAttribute('aria-label',`Descargar ${fmt(count)} beneficiarios de ${p?.name??'todas las parroquias'} en Excel`);document.querySelectorAll('#areas [data-key]').forEach(e=>{e.classList.toggle('selected',e.dataset.key===key);e.classList.toggle('dimmed',Boolean(key)&&key!==e.dataset.key);e.setAttribute('aria-pressed',String(e.dataset.key===key));});$('markers').firstElementChild.setAttribute('aria-pressed',String(key==='CHONGON'));renderList();if(fit&&key)fitParish(key);else if(fit)setView(view);else renderLabels();$('tooltip').hidden=true;if(key==='GUAYAQUIL')notify('561 beneficiarios sin parroquia específica. No se asignan a una zona del mapa.');}
function renderList(){const query=$('search').value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const parishes=DATA.parishes.filter(p=>(p.name+' '+p.key).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query));$('listCount').textContent=`${parishes.length} grupos`;$('parishList').replaceChildren();for(const p of parishes){const b=document.createElement('button');b.className='parish-row'+(p.key===selected?' active':'');b.dataset.key=p.key;b.setAttribute('aria-pressed',String(p.key===selected));b.setAttribute('aria-label',`${p.name}, ${fmt(p.count)} beneficiarios`);const top=document.createElement('span');top.className='row-top';const name=document.createElement('span');name.className='row-name';name.textContent=p.name;const count=document.createElement('span');count.className='row-count';count.textContent=fmt(p.count);top.append(name,count);const bottom=document.createElement('span');bottom.className='row-bottom';const track=document.createElement('span');track.className='bar-track';const fill=document.createElement('span');fill.className='bar-fill';fill.style.width=(p.count/DATA.parishes[0].count*100)+'%';fill.style.background=p.key==='GUAYAQUIL'?'#b6a991':color(p.count);track.append(fill);const share=document.createElement('span');share.className='row-pct';share.textContent=pct(p.count/DATA.total*100)+' %';bottom.append(track,share);b.append(top,bottom);b.addEventListener('click',()=>choose(selected===p.key?'':p.key,true));$('parishList').append(b);}if(!parishes.length){const e=document.createElement('p');e.className='empty-list';e.textContent='No se encontraron parroquias.';$('parishList').append(e);}}
let toastTimer;function notify(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
function zoom(f,cx=.5,cy=.5){const w=box[2]*f,h=box[3]*f;if(w<.7||w>6500)return;setBox([box[0]+(box[2]-w)*cx,box[1]+(box[3]-h)*cy,w,h]);}
async function init(){try{if(window.DASHBOARD_OFFLINE){DATA=window.DASHBOARD_OFFLINE.data;GEO=window.DASHBOARD_OFFLINE.geography;}else{const responses=await Promise.all([fetch('data.json'),fetch('geography.json')]);if(responses.some(r=>!r.ok))throw Error('Datos no disponibles');[DATA,GEO]=await Promise.all(responses.map(r=>r.json()));}$('downloadAll').href=fileUrl('downloads/todos.xlsx');$('total').textContent=fmt(DATA.total);$('parishCount').textContent=DATA.parishes.filter(p=>p.key!=='GUAYAQUIL').length;for(const p of [...DATA.parishes].sort((a,b)=>a.name.localeCompare(b.name,'es'))){const o=document.createElement('option');o.value=p.key;o.textContent=`${p.name} (${fmt(p.count)})`;$('parishSelect').append(o);}buildMap();setView('city');choose('');$('search').addEventListener('input',renderList);$('parishSelect').addEventListener('change',e=>choose(e.target.value,true));$('showUnspecified').addEventListener('click',()=>choose('GUAYAQUIL',false));document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));$('zoomIn').addEventListener('click',()=>zoom(.7));$('zoomOut').addEventListener('click',()=>zoom(1/.7));$('resetMap').addEventListener('click',()=>{choose('');setView(view);});$('sourceButton').addEventListener('click',()=>$('sourceDialog').showModal());$('closeDialog').addEventListener('click',()=>$('sourceDialog').close());$('sourceDialog').addEventListener('click',e=>{if(e.target===$('sourceDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});const svg=$('map');svg.addEventListener('wheel',e=>{e.preventDefault();const r=svg.getBoundingClientRect();zoom(e.deltaY>0?1.12:1/1.12,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);},{passive:false});svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;moved=false;drag={x:e.clientX,y:e.clientY,box:[...box],id:e.pointerId};});svg.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>5){moved=true;$('tooltip').hidden=true;}if(moved){const r=svg.getBoundingClientRect();setBox([drag.box[0]-dx/r.width*drag.box[2],drag.box[1]-dy/r.height*drag.box[3],drag.box[2],drag.box[3]]);}});window.addEventListener('pointerup',()=>{drag=null;setTimeout(()=>moved=false,0);});window.addEventListener('pointercancel',()=>{drag=null;});new ResizeObserver(()=>{if(!selected)setView(view);else renderLabels();}).observe($('mapStage'));}catch(e){$('mapStage').replaceChildren();const d=document.createElement('div');d.className='error-box';d.textContent='No fue posible cargar el dashboard. Recarga la página para volver a intentarlo.';$('mapStage').append(d);console.error(e);}}
function dismissSelection(event){
 if(!selected||moved)return;
 // Inspect the original target before a parish click redraws its label or marker.
 const target=event.target;
 if(!(target instanceof Element)||target.closest('a,button,input,select,textarea,label,dialog,[role="button"],.map-callout'))return;
 choose('');
}
document.addEventListener('click',dismissSelection,true);
init();
