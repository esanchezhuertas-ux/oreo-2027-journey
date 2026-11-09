'use strict';
(()=>{
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
// Monochrome controls take their tone from their component. Reward illustrations keep their original colours.
const iconNames = new Set([
  'arrow', 'back', 'ball', 'check', 'chevron', 'close', 'copy', 'external', 'eye',
  'eye-off', 'filter', 'forward', 'grid', 'help', 'lock', 'logout', 'map-pin',
  'mail', 'menu', 'pencil', 'phone', 'plus', 'scarf', 'search', 'shield', 'shirt', 'sort',
  'sparkles', 'trash', 'user', 'reward-ball', 'reward-shirt'
]);
function icon(name) {
  if (!iconNames.has(name)) return '';
  const src = `assets/icons/${name}.svg`;
  if (name === 'help' || name === 'scarf' || name.startsWith('reward-')) {
    return `<img class="icon prize-icon" src="${src}" alt="">`;
  }
  return `<span class="icon figma-icon icon-${name}" style="--icon-file:url('${src}')" aria-hidden="true"></span>`;
}
$$('[data-icon]').forEach(e=>e.innerHTML=icon(e.dataset.icon));
$('#brand').innerHTML=window.BRAND_SVG||'<b>OREO</b> × LALIGA';
const players=window.Demo.entries(), clubs=Object.fromEntries(window.PLAYERS.map(p=>[p.clubKey,p.club])), positions={POR:'Portero',DEF:'Defensa',MED:'Centrocampista',DEL:'Delantero'};
const emptyFilters=()=>({club:'',positions:[],date:'all',gold:false,available:false});
const state={...emptyFilters(),q:'',selectedPlayer:'',view:'grid',group:'none',sort:'recent'};
let toastTimer, liftedCard=null;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(message){const e=$('#toast');clearTimeout(toastTimer);e.textContent=message;e.hidden=false;toastTimer=setTimeout(()=>e.hidden=true,3800);}
function filter(list=players,s=state){return window.CollectionDomain.filterCollection(list,s);}
const searchInput=$('#search'),suggestionList=$('#search-suggestions');
let suggestionsOpen=false,activeSuggestion=-1,suggestedPlayers=[];
function closeSuggestions(){suggestionsOpen=false;activeSuggestion=-1;suggestionList.hidden=true;searchInput.setAttribute('aria-expanded','false');searchInput.removeAttribute('aria-activedescendant');}
function renderSuggestions(list=filter()){
 suggestedPlayers=list.slice(0,5);activeSuggestion=-1;searchInput.removeAttribute('aria-activedescendant');
 const show=suggestionsOpen&&!!state.q.trim()&&!state.selectedPlayer;
 suggestionList.hidden=!show;searchInput.setAttribute('aria-expanded',String(show));
 if(!show)return;
 suggestionList.innerHTML=suggestedPlayers.length?suggestedPlayers.map(p=>`<button type="button" class="search-suggestion" role="option" aria-selected="false" tabindex="-1" id="suggestion-${p.id}" data-suggestion="${p.id}"><span><strong>${esc(p.name)}</strong><small>${esc(p.club)} · ${positions[p.position]}</small></span><span class="suggestion-copies">${p.available?`×${p.available}`:'Canjeado'}</span></button>`).join(''):'<p class="search-no-match">No hay jugadores obtenidos con esta búsqueda y estos filtros.</p>';
}
function selectSuggestion(id){const p=suggestedPlayers.find(p=>p.id===id);if(!p)return;state.q=p.name;state.selectedPlayer=p.id;searchInput.value=p.name;closeSuggestions();render();searchInput.focus({preventScroll:true});}
function setActiveSuggestion(index){activeSuggestion=index;const options=$$('[role="option"]',suggestionList);options.forEach((option,i)=>option.setAttribute('aria-selected',String(i===index)));const option=options[index];if(option){searchInput.setAttribute('aria-activedescendant',option.id);option.scrollIntoView({block:'nearest'});}else searchInput.removeAttribute('aria-activedescendant');}
$$('[data-total-available]').forEach(e=>e.textContent=players.reduce((sum,p)=>sum+p.available,0));
$$('[data-total-unique]').forEach(e=>e.textContent=`${players.filter(p=>p.copies>0).length}/80`);
function copiesBadge(p,suffix=''){const id=`counter-${p.id}${suffix}`,shape='M94.7092 62.4634L76.9888 8.03405C75.4289 3.2429 70.9627 0 65.924 0H28.7883C23.7498 0 19.2838 3.24262 17.7237 8.03347L0 62.4634Z',inner='M0.051 110.248C-0.593 126.217 4.87 141.508 15.63 154.092C38.386 180.707 78.225 183.843 104.755 160.79C119.732 147.775 127.937 129.389 127.19 110.248V0H0.001L0.052 110.248Z';return `<svg class="copies-overlay" viewBox="0 0 160 232" aria-hidden="true"><defs><clipPath id="${id}-mask" clipPathUnits="userSpaceOnUse"><path d="${inner}" transform="translate(16.38 30.75)"/></clipPath><clipPath id="${id}-badge" clipPathUnits="userSpaceOnUse"><path d="${shape}"/></clipPath></defs><g clip-path="url(#${id}-mask)"><g transform="translate(32.6454 169.83)"><path d="${shape}" fill="white" stroke="#272425" stroke-width="4.36364" stroke-linejoin="round" clip-path="url(#${id}-badge)"/></g><g class="copies-letter" text-anchor="middle" stroke-width="4.36364" stroke-linejoin="round" paint-order="stroke fill"><text x="80" y="198" fill="#000" stroke="#000" opacity=".25" transform="translate(2.182 2.182)">x${p.available}</text><text x="80" y="198" fill="#fff" stroke="#272425">x${p.available}</text></g></g></svg>`;}

function codeList(inventory,t){
 const lang=window.Demo.lang==='en'?'en-GB':'es-ES';
 const date=new Intl.DateTimeFormat(lang,{day:'2-digit',month:'2-digit',year:'numeric'});
 const records=[...inventory.records].sort((a,b)=>b.time-a.time);
 const rows=records.map(copy=>{
  const status=copy.used?t('Usado','Used'):t('Disponible','Available');
  const rarity=copy.rarity==='gold'?t('Dorada','Gold'):t('Común','Common');
  return `<li><div class="code-reference"><code>${esc(copy.code)}</code><small>${date.format(copy.time)} · ${rarity}</small></div><span class="code-status ${copy.used?'is-used':'is-available'}">${icon(copy.used?'lock':'check')}${status}</span><button class="icon-button copy-code" data-copy="${esc(copy.code)}" aria-label="${t('Copiar código','Copy code')} ${esc(copy.code)}">${icon('copy')}</button></li>`;
 }).join('');
 return `<details class="associated-codes"><summary><span>${t('Códigos asociados','Associated codes')}</span><b>${inventory.copies}</b>${icon('chevron')}</summary>
 <ul tabindex="0" aria-label="${t('Lista de códigos asociados','Associated code list')}">${rows}</ul></details>`;
}

function crest(key,suffix){if(window.CATALOG_CRESTS?.[key])return '<img src="'+window.CATALOG_CRESTS[key]+'" alt="" loading="lazy">';return (window.CRESTS?.[key]||'').replace(/id="([^"]+)"/g,(_,id)=>`id="${id}-${suffix}"`).replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${id}-${suffix})`).replace(/(?:xlink:)?href="#([^"]+)"/g,(_,id)=>`href="#${id}-${suffix}"`);}
function cardFace(p,detail,suffix) {
 return `<span class="card-face"><span class="cookie-emblem"></span><span class="player-crop"><img class="player-photo player-${p.id}" src="${p.image}" width="320" height="460" alt="" loading="${detail||players.indexOf(p)<4?'eager':'lazy'}" decoding="async" draggable="false"></span><svg class="card-name card-lettering" viewBox="0 0 142 24" aria-hidden="true"><text x="71" y="18" text-anchor="middle">${esc(p.label)}</text></svg><span class="crest">${crest(p.clubKey,p.id+suffix)}</span><svg class="player-number card-lettering" viewBox="0 0 30 30" aria-hidden="true"><text x="15" y="23" text-anchor="middle">${p.number}</text></svg><span class="player-position">${p.position}</span>${p.available&&!detail?copiesBadge(p,suffix):''}<span class="holo-foil" aria-hidden="true"></span><span class="holo-glare" aria-hidden="true"></span><span class="holo-sparkles" aria-hidden="true"></span></span>`;
}
function receivedCard(player,gold) {
 const card = {...player, type:gold?'gold':'blue', available:1};
 return '<span class="holo-card '+card.type+'" tabindex="0" role="group" aria-label="'+esc(player.name)+'" style="--biscuit-ink:'+(gold?'#f4d74c':'#0cbcff')+'">'+cardFace(card,true,'-receipt')+'</span>';
}
function card(p,detail=false){return `<button class="holo-card ${p.type}${p.type==='gold'&&!p.records.some(copy=>copy.rarity==='gold'&&!copy.used)?' gold-spent':p.available===0?' no-copies':''}" data-player="${p.id}" data-copies="${p.copies}" ${detail?'data-detail="true"':''} aria-label="${esc(p.name)}, ${p.type==='gold'?'cromo dorado':'cromo azul'}, ${p.available} ${p.available===1?'copia disponible':'copias disponibles'}${detail?'. Mueve el cursor para ver el brillo.':'. Ver cromo.'}" style="--biscuit-ink:${p.type==='gold'?'#f4d74c':'#0cbcff'}">${cardFace(p,detail,detail?'-detail':'')}</button>`;}
function tile(p,slot=false){
 const goldSpent=p.type==='gold'&&!p.records.some(copy=>copy.rarity==='gold'&&!copy.used);
 const english=window.Demo.lang==='en';
 const availableLabel=goldSpent
  ?(english?`${p.available} common`:`${p.available} ${p.available===1?'común':'comunes'}`)
  :(english?'Redeemable':'Canjeable');
 const mark=p.type==='gold'?`<span class="shiny-badge" aria-label="${english?'Gold finish':'Acabado dorado'}">${icon('sparkles')}</span>`:'';
 const availability=p.available?`<span class="available-badge">${icon('check')}${availableLabel}</span>`:'';
 return `<article class="card-tile">${slot?`<span class="club-slot">${p.position}</span>`:''}<div class="card-meta">${p.isNew&&!goldSpent?'<span class="new-badge">NUEVO</span>':''}${mark}</div><div class="card-scene">${card(p)}</div><div class="mobile-card-caption"><span>${esc(p.name)}</span><span>${esc(p.club)}</span></div><div class="availability-badge-wrap">${availability}</div></article>`;
}
function placeholder(pos,key,suffix){return `<div class="missing-card" aria-hidden="true"><span class="cookie-emblem"></span><span class="crest">${crest(key,suffix)}</span><span class="player-position">${pos}</span><img class="missing-player" src="assets/player-uncollected-clipped.svg" width="175" height="242" alt="" draggable="false"></div>`;}
function missing(pos,key){return `<article class="card-tile missing-tile" aria-label="${positions[pos]} de ${clubs[key]} aún no conseguido"><div class="card-meta"></div><div class="card-scene">${placeholder(pos,key,`missing-${pos}`)}</div><div class="availability-badge-wrap"></div></article>`;}
function restoreLiftedCard(){if(!liftedCard)return;liftedCard.classList.remove('is-lifted');liftedCard.parentElement?.querySelector('.lifted-placeholder')?.remove();liftedCard=null;}
function liftCard(p){restoreLiftedCard();const source=$(`[data-player="${p.id}"]`,$('#card-results'));if(!source)return;source.insertAdjacentHTML('beforebegin',`<span class="lifted-placeholder" aria-hidden="true">${placeholder(p.position,p.clubKey,`lifted-${p.id}`)}</span>`);source.classList.add('is-lifted');liftedCard=source;}

function clubRail(key,name){const copies=players.filter(p=>p.clubKey===key).reduce((sum,p)=>sum+p.available,0);return `<aside class="club-rail" aria-label="${name}: ${copies} ${copies===1?'copia disponible':'copias disponibles'}"><span class="club-rail-crest" aria-hidden="true">${crest(key,'rail')}</span><span class="club-rail-name" aria-hidden="true">${name}</span><span class="club-rail-copies" aria-hidden="true"><strong>×${copies}</strong><span>${copies===1?'copia':'copias'}</span></span></aside>`;}

function render(){
 const unique=new Set(players.map(p=>p.playerId)).size;
 $$('[data-total-unique]').forEach(e=>e.textContent=unique+'/80');
 $$('[data-total-available]').forEach(e=>e.textContent=players.reduce((n,p)=>n+p.available,0));
 const list=filter(), grid=$('#card-results');
 $('#results-count').textContent=`${new Set(list.map(p=>p.playerId)).size} ${new Set(list.map(p=>p.playerId)).size===1?'cromo único':'cromos únicos'}${state.gold?' · Dorados':''}${state.available?' · Solo disponibles':''}`;
 $('#sort-label').textContent=state.view==='clubs'?'Club y posición':state.sort==='name'?'Nombre A–Z':state.sort==='oldest'?'Más antiguos primero':'Más recientes primero';
 $('#available-toggle').checked=state.available;$('#clear-search').hidden=!state.q;
 $('#grid-view').setAttribute('aria-pressed',String(state.view==='grid'));$('#clubs-view').setAttribute('aria-pressed',String(state.view==='clubs'));
 $('#mobile-view').innerHTML=icon(state.view==='grid'?'shield':'grid');$('#mobile-view').setAttribute('aria-label',state.view==='grid'?'Cambiar a vista clubs':'Cambiar a vista cuadrícula');
 if(!players.length)grid.innerHTML='<div class="empty-state"><h3>Aún no tienes cromos</h3><p>Registra tu primer código para empezar tu colección.</p><button class="button primary" data-register-code>Registrar código</button></div>';
 else if(!list.length)grid.innerHTML=`<div class="empty-state">${icon('search')}<h3>No hay cromos con estos filtros</h3><p>Prueba otro jugador o restablece los filtros para ver tu colección.</p><button class="button" data-reset>Ver toda mi colección</button></div>`;
 else if(state.view==='clubs'){
  grid.innerHTML=Object.entries(clubs).map(([key,name])=>{
   const items=list.filter(p=>p.clubKey===key);if(!items.length)return '';
   const showMissing=!state.gold&&!state.available&&!state.q&&!state.positions.length&&state.date==='all';
   const slots=showMissing?Object.keys(positions).map(pos=>{const found=items.filter(p=>p.position===pos);return found.length?found.map(p=>tile(p)).join(''):missing(pos,key)}):items.sort((a,b)=>Object.keys(positions).indexOf(a.position)-Object.keys(positions).indexOf(b.position)).map(p=>tile(p));
   const cards=slots.join('');
   const count=showMissing?Object.keys(positions).reduce((total,pos)=>total+Math.max(1,items.filter(p=>p.position===pos).length),0):items.length;
   const pages=Math.ceil(count/2);
   const dots=Array.from({length:pages},(_,i)=>`<button type="button" data-pair="${key}" data-index="${i}" aria-label="${window.Demo.lang==='en'?'Show pair':'Ver pareja'} ${i+1}" aria-pressed="${i===0}"></button>`).join('');
   return `<section class="club-section"><h3 class="club-heading">${name}<span class="club-heading-count"><span> · </span>${new Set(players.filter(p=>p.clubKey===key).map(p=>p.playerId)).size}/4<span> cromos</span></span></h3><div class="club-row">${clubRail(key,name)}<div class="card-grid club-scroller" id="club-${key}" tabindex="0" aria-label="Cromos de ${name}">${cards}</div></div><div class="club-controls"><button data-carousel="${key}" data-dir="-1" aria-label="Cromos anteriores de ${name}" disabled>${icon('back')}</button><div class="club-pages">${dots}</div><button data-carousel="${key}" data-dir="1" aria-label="Siguientes cromos de ${name}" ${pages<2?'disabled':''}>${icon('arrow')}</button></div><p class="club-page-index" id="page-${key}">${pairLabel(1,pages)}</p></section>`;
  }).join('');
  $$('.club-scroller').forEach(el=>el.addEventListener('scroll',()=>updateCarousel(el),{passive:true}));
 }else if(state.group!=='none'){
  const groups=state.group==='club'?clubs:positions;
  grid.innerHTML=Object.entries(groups).map(([key,label])=>{const items=list.filter(p=>(state.group==='club'?p.clubKey:p.position)===key);return items.length?`<section class="club-section"><h3 class="club-heading">${label}<small>${items.length} ${items.length===1?'cromo':'cromos'}</small></h3><div class="card-grid">${items.map(p=>tile(p)).join('')}</div></section>`:''}).join('');
 }else grid.innerHTML=`<div class="card-grid">${list.map(p=>tile(p)).join('')}${list.length===11?'<div class="blank-tile" aria-hidden="true"></div>':''}</div>`;
 renderChips();renderSuggestions(list);window.CopyStack?.init(grid);window.Holo?.init(grid);
}
function pairLabel(page,total){
 return window.Demo.lang==='en'?`Pair ${page} of ${total}`:`Pareja ${page} de ${total}`;
}
function updateCarousel(el){
 const key=el.id.slice(5),step=el.clientWidth+parseFloat(getComputedStyle(el).columnGap);
 const dots=$$(`[data-pair="${key}"]`),page=Math.min(dots.length,Math.round(el.scrollLeft/step)+1);
 $(`#page-${key}`).textContent=pairLabel(page,dots.length);
 dots.forEach((button,i)=>button.setAttribute('aria-pressed',String(i+1===page)));
 $(`[data-carousel="${key}"][data-dir="-1"]`).disabled=el.scrollLeft<4;
 $(`[data-carousel="${key}"][data-dir="1"]`).disabled=el.scrollLeft+el.clientWidth>=el.scrollWidth-4;
}
$('#card-results').addEventListener('click',e=>{
 const pair=e.target.closest('[data-pair]');
 if(!pair)return;
 const el=document.getElementById('club-'+pair.dataset.pair);
 const step=el.clientWidth+parseFloat(getComputedStyle(el).columnGap);
 el.scrollTo({left:Number(pair.dataset.index)*step,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
});
function renderChips(){const chips=[];if(state.club)chips.push(['club',clubs[state.club]]);state.positions.forEach(p=>chips.push(['position:'+p,positions[p]]));if(state.gold)chips.push(['gold','Solo dorados']);if(state.date!=='all')chips.push(['date',{today:'Hoy',week:'Últimos 7 días',month:'Últimos 30 días'}[state.date]]);if(state.available)chips.push(['available','Solo disponibles']);const e=$('#active-filters');e.hidden=!chips.length;e.innerHTML=chips.map(([key,label])=>`<button class="filter-chip" data-remove="${key}" aria-label="Quitar filtro ${label}">${label}${icon('close')}</button>`).join('')+(chips.length?'<button class="clear-all" data-clear-filters>Limpiar filtros</button>':'');$('#filter-count').textContent=chips.length;$('#filter-count').hidden=!chips.length;}
const mobileSheet=matchMedia('(max-width:760px)');
function closeDialog(dialog){
 if(dialog.id==='card-dialog'&&window.ModalMotion?.dismiss){if(dialog.dataset.closing)return;dialog.dataset.closing='true';window.ModalMotion.dismiss(dialog).then(handled=>{if(!handled)dialog.close();}).catch(()=>dialog.close());return;}
 if(!mobileSheet.matches||!['card-dialog','register-dialog'].includes(dialog.id)||matchMedia('(prefers-reduced-motion: reduce)').matches){dialog.close();return;}
 if(dialog.dataset.closing)return;
 dialog.dataset.closing='true';dialog.classList.add('sheet-dragging');
 const from=dialog.style.transform||'translateY(0)';
 const animation=dialog.animate([{transform:from},{transform:'translateY(100%)'}],{duration:240,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
 animation.finished.then(()=>{dialog.close();animation.cancel();dialog.style.transform='';dialog.classList.remove('sheet-dragging');delete dialog.dataset.closing;}).catch(()=>{});
}
['card-dialog','register-dialog'].forEach(id=>{
 const dialog=document.getElementById(id),handle=document.createElement('button');
 handle.type='button';handle.className='sheet-handle';handle.setAttribute('aria-label','Cerrar modal: arrastra hacia abajo o pulsa');
 handle.innerHTML='<span aria-hidden="true"></span>';dialog.prepend(handle);
 let drag=null,suppressClick=false;
 handle.addEventListener('pointerdown',e=>{
  if(!mobileSheet.matches||dialog.classList.contains('modal-intro')||dialog.dataset.closing)return;
  drag={y:e.clientY,lastY:e.clientY,time:e.timeStamp,lastTime:e.timeStamp,dy:0,velocity:0};suppressClick=false;
  dialog.classList.add('sheet-dragging');handle.setPointerCapture(e.pointerId);
 });
 handle.addEventListener('pointermove',e=>{if(!drag)return;drag.dy=Math.max(0,e.clientY-drag.y);drag.velocity=(e.clientY-drag.lastY)/Math.max(1,e.timeStamp-drag.lastTime);drag.lastY=e.clientY;drag.lastTime=e.timeStamp;dialog.style.transform=`translateY(${drag.dy}px)`;if(drag.dy>5)suppressClick=true;});
 const finish=e=>{if(!drag)return;const dismiss=e.type!=='pointercancel'&&(drag.dy>88||(drag.dy>24&&drag.velocity>.5));drag=null;if(dismiss){closeDialog(dialog);}else{const animation=dialog.animate([{transform:dialog.style.transform||'translateY(0)'},{transform:'translateY(0)'}],{duration:180,easing:'ease-out'});animation.finished.then(()=>{dialog.style.transform='';dialog.classList.remove('sheet-dragging');}).catch(()=>{});}};
 handle.addEventListener('pointerup',finish);handle.addEventListener('pointercancel',finish);
 handle.addEventListener('click',()=>{if(suppressClick){suppressClick=false;return;}closeDialog(dialog);});
 dialog.addEventListener('cancel',e=>{if(mobileSheet.matches||dialog.id==='card-dialog'){e.preventDefault();closeDialog(dialog);}});
});
document.addEventListener('keydown',e=>{if(e.key==='Tab')document.documentElement.classList.add('keyboard-nav');},true);
document.addEventListener('pointerdown',()=>document.documentElement.classList.remove('keyboard-nav'),true);
function showDialog(dialog){closeMenus();closeSuggestions();dialog.tabIndex=-1;dialog.showModal();dialog.focus({preventScroll:true});document.documentElement.style.overflow='hidden';}
$$('dialog').forEach(d=>{d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(d);}});d.addEventListener('close',()=>{d.style.transform='';d.classList.remove('sheet-dragging');delete d.dataset.closing;document.documentElement.style.overflow='';if(d.id==='card-dialog'){window.ModalMotion?.close(d);restoreLiftedCard();$('#detail-content').innerHTML='';}});});
function openDetail(id){
 const picked=players.find(p=>p.id===id);
 if(!picked)return;
 const dialog=$('#card-dialog'), content=$('#detail-content');
 const source=$(`[data-player="${id}"]`,$('#card-results')), sourceRect=source?.getBoundingClientRect();
 const variants=['blue','gold'].flatMap(type=>{
  const records=picked.records.filter(copy=>copy.rarity===type);
  return records.length?[{...picked,type,records,copies:records.length,available:records.filter(copy=>!copy.used).length}]:[];
 });
 const initial=variants.find(p=>p.type===picked.type);
 const total=picked.copies,available=picked.available;
 const gold=variants.find(p=>p.type==='gold')?.available||0,common=available-gold;
 const t=(es,en)=>window.Demo.lang==='en'?en:es;
 const breakdown=t(`${common} ${common===1?'común':'comunes'} · ${gold} ${gold===1?'dorada':'doradas'}`,`${common} common · ${gold} gold`);
 const history=t('Ver historial completo','View full history');
 const used=total-available;
 const selector=variants.length>1?`<div class="detail-rarities" role="group" aria-label="${t('Rareza','Rarity')}">${['blue','gold'].map(type=>`<button type="button" data-rarity="${type}" aria-pressed="${type===initial.type}">${type==='gold'?t('Dorada','Gold'):t('Común','Common')}</button>`).join('')}</div>`:'';
 content.innerHTML=`<div class="detail-layout"><div class="detail-figure"><div class="detail-stage">${card(initial,true)}</div>${selector}</div>
 <div class="detail-info"><header class="detail-identity"><h2 id="detail-title">${esc(picked.name)}</h2><p>${esc(picked.club)} · ${positions[picked.position]} · #${picked.number}</p></header>
 <div class="detail-inventory"><span class="inventory-status ${available?'':'exhausted'}">${available?icon('check'):''}${available?t('Copias disponibles','Available copies'):t('Sin copias disponibles','No copies available')}</span>
 <div class="inventory-count"><strong>${available}</strong><b>${breakdown}</b></div><small>${total} ${t(total===1?'copia obtenida':'copias obtenidas',total===1?'copy collected':'copies collected')} · ${used} ${t(used===1?'utilizada':'utilizadas','used')}</small></div>
 <div class="detail-scroll">${codeList(picked,t)}<button type="button" class="detail-history">${history}</button></div>
 <div class="redeem-action"></div></div></div>`;
 const availableRewards=window.Rewards?.available()||[];
 const action=content.querySelector('.redeem-action');
 function paintRewards(variant){
  const direct=variant.type==='gold' && variant.available>0 && availableRewards.some(r=>r.id==='gold');
  const choices=availableRewards.filter(r=>direct?r.id==='gold':r.id!=='gold');
  action.replaceChildren();action.hidden=!choices.length;
  if(!choices.length)return;
  const rewardIcons={gold:'shirt',shirt:'shirt',scarf:'scarf',ball:'ball'};
  if(choices.length>1){
   const label=document.createElement('label');
   label.className='detail-choice';
   label.textContent=t('Premio','Reward');
   const select=document.createElement('select');
   for(const reward of choices)select.add(new Option(reward.label,reward.id));
   label.append(select);
   action.append(label);
  }
  const button=document.createElement('button');
  button.type='button';
  button.className='button primary';
  action.append(button);
  const select=action.querySelector('select');
  const selectedId=()=>select?.value||choices[0].id;
  const paint=()=>{const id=selectedId();button.innerHTML=icon(rewardIcons[id])+esc(direct?t('Quiero mi camiseta','Get my shirt'):t('Tienes premios que canjear','You have rewards to redeem'));};
  paint();
  if(select)select.onchange=paint;
  button.onclick=()=>{
   const id=selectedId();
   if(dialog.dataset.closing)return;
   dialog.addEventListener('close',()=>window.Rewards.open(id),{once:true});
   closeDialog(dialog);
  };
 }
 paintRewards(initial);
 content.querySelector('.detail-history').onclick=()=>{
  dialog.addEventListener('close',()=>{location.hash='history';},{once:true});
  closeDialog(dialog);
 };
 for(const toggle of content.querySelectorAll('[data-rarity]')){
  toggle.onclick=()=>{
   const next=variants.find(p=>p.type===toggle.dataset.rarity);
   if(!next||toggle.getAttribute('aria-pressed')==='true')return;
   const element=content.querySelector('.holo-card'), template=document.createElement('template');
   paintRewards(next);
   template.innerHTML=card(next,true);
   const face=template.content.firstElementChild;
   for(const attr of ['class','data-player','aria-label','style'])element.setAttribute(attr,face.getAttribute(attr));
   element.replaceChildren(...face.childNodes);
   content.querySelectorAll('[data-rarity]').forEach(b=>b.setAttribute('aria-pressed',String(b===toggle)));
  };
 }
 showDialog(dialog);
 liftCard(picked);
 window.Holo?.init(dialog);
 window.ModalMotion?.open(dialog,sourceRect,source);
}
searchInput.addEventListener('input',e=>{state.q=e.target.value;state.selectedPlayer='';suggestionsOpen=true;render();});
searchInput.addEventListener('focus',()=>{if(state.q.trim()&&!state.selectedPlayer){suggestionsOpen=true;renderSuggestions();}});
searchInput.addEventListener('keydown',e=>{
 if(e.key==='Escape'){if(!suggestionList.hidden)e.preventDefault();closeSuggestions();return;}
 if(e.key==='Tab'){closeSuggestions();return;}
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){
  if(!state.q.trim()||state.selectedPlayer)return;e.preventDefault();if(suggestionList.hidden){suggestionsOpen=true;renderSuggestions();}
  if(suggestedPlayers.length)setActiveSuggestion(e.key==='ArrowDown'?(activeSuggestion+1)%suggestedPlayers.length:(activeSuggestion<=0?suggestedPlayers.length-1:activeSuggestion-1));
 }else if(e.key==='Enter'&&!suggestionList.hidden&&activeSuggestion>=0){e.preventDefault();selectSuggestion(suggestedPlayers[activeSuggestion].id);}
});
suggestionList.addEventListener('pointerdown',e=>{if(e.target.closest('[data-suggestion]'))e.preventDefault();});
suggestionList.addEventListener('click',e=>{const option=e.target.closest('[data-suggestion]');if(option)selectSuggestion(option.dataset.suggestion);});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.search-field'))closeSuggestions();});
document.addEventListener('focusin',e=>{if(!e.target.closest('.search-field'))closeSuggestions();});
$('#clear-search').addEventListener('click',()=>{state.q='';state.selectedPlayer='';searchInput.value='';closeSuggestions();render();searchInput.focus({preventScroll:true});});$('#available-toggle').addEventListener('change',e=>{state.available=e.target.checked;render();});
function setView(view){state.view=view;render();}$('#grid-view').onclick=()=>setView('grid');$('#clubs-view').onclick=()=>setView('clubs');$('#mobile-view').onclick=()=>setView(state.view==='grid'?'clubs':'grid');
const filterForm=$('#filter-form');filterForm.elements.club.replaceChildren(new Option('Todos los clubes',''),...Object.entries(clubs).map(([k,v])=>new Option(v,k)));
function fillFilterForm(s){filterForm.elements.club.value=s.club;filterForm.elements.date.value=s.date;filterForm.elements.gold.checked=s.gold;filterForm.elements.available.checked=s.available;filterForm.elements.group.value=s.group;filterForm.elements.sort.value=s.sort;$$('[name=position]',filterForm).forEach(el=>el.checked=s.positions.includes(el.value));updateDraftCount();}
function draft(){return {...state,club:filterForm.elements.club.value,positions:$$('[name=position]:checked',filterForm).map(e=>e.value),date:filterForm.elements.date.value,gold:filterForm.elements.gold.checked,available:filterForm.elements.available.checked,group:filterForm.elements.group.value,sort:filterForm.elements.sort.value};}
function updateDraftCount(){const n=filter(players,draft()).length;$('#apply-filters').textContent=`Ver ${n} ${n===1?'cromo':'cromos'}`;}
$('#filter-button').onclick=()=>{
 const sortDialog=$('#sort-dialog');
 if(sortDialog.open){
  sortDialog.addEventListener('close',()=>{fillFilterForm(state);showDialog($('#filter-dialog'));},{once:true});
  sortDialog.close();
 }else{fillFilterForm(state);showDialog($('#filter-dialog'));}
};filterForm.addEventListener('change',updateDraftCount);filterForm.addEventListener('submit',e=>{e.preventDefault();const previousGroup=state.group;Object.assign(state,draft());if(state.group!==previousGroup)state.view='grid';render();$('#filter-dialog').close();});$('#reset-draft').onclick=()=>fillFilterForm({...state,...emptyFilters()});
const sortForm=$('#sort-form');$('#sort-button').onclick=()=>{sortForm.elements.group.value=state.group;sortForm.elements.sort.value=state.sort;showDialog($('#sort-dialog'));};sortForm.onsubmit=e=>{e.preventDefault();state.group=sortForm.elements.group.value;state.sort=sortForm.elements.sort.value;if(state.group!=='none')state.view='grid';render();$('#sort-dialog').close();};
function closeMenus(){['account','mobile'].forEach(x=>{const menu=$(`#${x}-menu`);menu.hidden=true;$(x==='account'?'#account-button':'#menu-button').setAttribute('aria-expanded','false');});}
function toggleMenu(button,menu){const isOpen=!menu.hidden;closeMenus();menu.hidden=isOpen;button.setAttribute('aria-expanded',String(!isOpen));}
$('#account-button').onclick=()=>toggleMenu($('#account-button'),$('#account-menu'));$('#menu-button').onclick=()=>toggleMenu($('#menu-button'),$('#mobile-menu'));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenus();});
document.addEventListener('click',e=>{const t=e.target;if(!t.closest('.account-wrap,.mobile-nav,#menu-button'))closeMenus();const copy=t.closest('[data-copy]');if(copy){if(navigator.clipboard?.writeText){navigator.clipboard.writeText(copy.dataset.copy).then(()=>{copy.innerHTML=icon('check');copy.setAttribute('aria-label','Código '+copy.dataset.copy+' copiado');copy.title='Copiado';}).catch(()=>{copy.title='Selecciona el código para copiarlo manualmente';});}else{copy.title='Selecciona el código para copiarlo manualmente';}}const close=t.closest('[data-close]');if(close)closeDialog(close.closest('dialog'));const register=t.closest('[data-register-code]');if(register){$('#register-form').reset();$('#register-result').hidden=true;showDialog($('#register-dialog'));if(document.documentElement.classList.contains('keyboard-nav'))$('#register-code').focus({preventScroll:true});}const unbuilt=t.closest('[data-unbuilt]');if(unbuilt){toast(`${unbuilt.dataset.unbuilt}: este prototipo se centra en Mi colección.`);closeMenus();}const p=t.closest('[data-player]');if(p&&!p.hasAttribute('data-detail'))openDetail(p.dataset.player);if(t.closest('[data-reset]')){Object.assign(state,emptyFilters(),{q:'',selectedPlayer:''});$('#search').value='';render();}if(t.closest('[data-clear-filters]')){Object.assign(state,emptyFilters());render();}const remove=t.closest('[data-remove]');if(remove){const key=remove.dataset.remove;if(key.startsWith('position:'))state.positions=state.positions.filter(p=>p!==key.slice(9));else state[key]=emptyFilters()[key];render();}const c=t.closest('[data-carousel]');if(c){const el=$(`#club-${c.dataset.carousel}`);el.scrollBy({left:Number(c.dataset.dir)*(el.clientWidth+parseFloat(getComputedStyle(el).columnGap)),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}});
const codeCells=[...document.querySelectorAll('.code-cell')];
const registrationForm = $('#register-form');
const registrationSubmit = registrationForm.querySelector('.register-submit');
function updateRegistrationSubmit() {
  registrationSubmit.disabled = !codeCells.every(cell => /^[A-Z0-9]$/.test(cell.value))
    || !registrationForm.querySelector('[type="checkbox"]').checked;
}
registrationForm.addEventListener('input', updateRegistrationSubmit);
registrationForm.addEventListener('reset', () => { registrationSubmit.disabled = true; });
codeCells.forEach((cell,i)=>{
cell.addEventListener('input',()=>{cell.value=cell.value.replace(/[^a-z0-9]/gi,'').toUpperCase().slice(-1);$('#register-result').hidden=true;if(cell.value&&i<codeCells.length-1)codeCells[i+1].focus();});
cell.addEventListener('keydown',e=>{if(e.key==='Backspace'&&!cell.value&&i>0)codeCells[i-1].focus();if(e.key==='ArrowLeft'&&i>0)codeCells[i-1].focus();if(e.key==='ArrowRight'&&i<codeCells.length-1)codeCells[i+1].focus();});
cell.addEventListener('paste',e=>{e.preventDefault();const text=e.clipboardData.getData('text').replace(/[^a-z0-9]/gi,'').toUpperCase().slice(0,codeCells.length);const offset=text.length===codeCells.length?0:i;[...text].forEach((v,j)=>{if(codeCells[offset+j])codeCells[offset+j].value=v;});codeCells[Math.min(codeCells.length-1,offset+text.length)].focus();$('#register-result').hidden=true;updateRegistrationSubmit();});
});
$('#register-form').addEventListener('submit',e=>{e.preventDefault();if(!e.target.reportValidity())return;const result=$('#register-result'),r=window.Demo.register(codeCells.map(c=>c.value).join(''));if(r.error){result.textContent=r.error==='duplicate'?'Este código ya se ha registrado.':'Código no válido.';result.hidden=false;return;}$('#register-dialog').close();window.dispatchEvent(new CustomEvent('oreo:registered',{detail:r}));});
window.CollectionUI={refresh(){players.splice(0,players.length,...window.Demo.entries());render();},openDetail,icon,showDialog,receivedCard};
render();
})();
