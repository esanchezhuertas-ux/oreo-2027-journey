/* On-demand FLIP: real source rectangle -> centered turn -> final modal slot. */
(()=>{'use strict';
 const running=new WeakMap();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function cleanup(dialog,entry){
  entry.animations.forEach(animation=>animation.cancel());
  entry.animations.length=0;
  entry.info.inert=false;entry.card.inert=false;
  if(entry.orbit?.isConnected)entry.orbit.replaceWith(entry.card);
  entry.orbit=null;
  dialog.classList.remove('modal-intro','modal-settling','modal-returning');
 }
 function close(dialog){
  const entry=running.get(dialog);
  if(entry){
   running.delete(dialog);cleanup(dialog,entry);
   dialog.removeEventListener('close',entry.onClose);
  }
  dialog.classList.remove('modal-intro','modal-settling','modal-returning');
 }
 function open(dialog,sourceRect,sourceElement){
  close(dialog);
  if(!dialog.open)return;
  const card=dialog.querySelector('.detail-stage .holo-card');
  const info=dialog.querySelector('.detail-info');
  if(!card||!info)return;
  const validSource=sourceRect&&['left','top','width','height'].every(key=>Number.isFinite(sourceRect[key]))&&sourceRect.width>0&&sourceRect.height>0;
  const entry={card,info,sourceRect,sourceElement,orbit:null,animations:[],closing:false,onClose:()=>close(dialog)};
  running.set(dialog,entry);dialog.addEventListener('close',entry.onClose,{once:true});
  const animate=!reduced.matches&&Boolean(card.animate);
  if(!animate)return;
  const orbit=document.createElement('div');
  orbit.className='modal-card-orbit';
  card.replaceWith(orbit);orbit.append(card);entry.orbit=orbit;
  const back=document.createElement('div');
  back.className='modal-card-back';
  back.setAttribute('aria-hidden','true');
  // Exact header logo. White knockout paths become the darker family background.
  back.innerHTML=(window.BRAND_SVG||'').replace(/fill="#272425"/g,'fill="currentColor"').replace(/fill="#fff"/g,'fill="var(--modal-back-color)"');
  orbit.append(back);
  orbit.style.setProperty('--modal-card-scale',getComputedStyle(card).scale||'1');
  info.inert=true;card.inert=true;dialog.classList.add('modal-intro');
  const target=card.getBoundingClientRect();
  const targetX=target.left+target.width/2,targetY=target.top+target.height/2;
  const centerX=innerWidth/2-targetX,centerY=innerHeight/2-targetY;
  const source=validSource?sourceRect:target;
  const startX=source.left+source.width/2-targetX,startY=source.top+source.height/2-targetY;
  const scaleX=source.width/target.width,scaleY=source.height/target.height;
  const center=`translate3d(${centerX}px,${centerY}px,0)`;
  const spin=orbit.animate([
   {transform:`translate3d(${startX}px,${startY}px,0) rotateY(0deg) scale(${scaleX},${scaleY})`,offset:0},
   {transform:`${center} rotateY(360deg) scale(1.05)`,offset:.52},
   {transform:`${center} rotateY(650deg) scale(1.05)`,offset:.82},
   {transform:`${center} rotateY(720deg) scale(1.05)`,offset:1}
  ],{duration:1450,easing:'cubic-bezier(.25,.55,.3,1)',fill:'forwards'});
  entry.animations.push(spin);
  spin.finished.then(()=>{
   if(running.get(dialog)!==entry||!dialog.open||entry.closing)return;
   dialog.classList.remove('modal-intro');dialog.classList.add('modal-settling');info.inert=false;
   const settle=orbit.animate([
    {transform:`${center} rotateY(720deg) scale(1.05)`},
    {transform:'translate3d(0,0,0) rotateY(720deg) scale(1)'}
   ],{duration:380,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'});
   entry.animations.push(settle);
   settle.finished.then(()=>{if(running.get(dialog)===entry&&!entry.closing)cleanup(dialog,entry);}).catch(()=>{});
  }).catch(()=>{});
 }
 async function dismiss(dialog, draggedY = 0){
  const entry=running.get(dialog);
  if(!entry||!dialog.open)return false;
  if(entry.closing)return true;
  entry.closing=true;entry.info.inert=true;entry.card.inert=true;
  if(reduced.matches||!entry.card.animate){dialog.close();return true;}
  dialog.classList.remove('modal-settling');
  dialog.classList.add('modal-intro','modal-returning');
  // If opening is interrupted, reverse its actual timeline from its current frame.
  if(entry.orbit&&entry.animations.length){
   const active=[...entry.animations].reverse();
   for(const animation of active){
    if(!dialog.open||running.get(dialog)!==entry)return true;
    try{animation.reverse();await animation.finished;animation.cancel();}catch{};
   }
   if(dialog.open)dialog.close();return true;
  }
  const card=entry.card;
  dialog.style.removeProperty('translate');
  card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg');
  const orbit=document.createElement('div');orbit.className='modal-card-orbit';
  card.replaceWith(orbit);orbit.append(card);entry.orbit=orbit;
  const back=document.createElement('div');
  back.className='modal-card-back';
  back.setAttribute('aria-hidden','true');
  back.innerHTML=(window.BRAND_SVG||'').replace(/fill="#272425"/g,'fill="currentColor"').replace(/fill="#fff"/g,'fill="var(--modal-back-color)"');
  orbit.append(back);orbit.style.setProperty('--modal-card-scale',getComputedStyle(card).scale||'1');
  const target=card.getBoundingClientRect();
  const source=entry.sourceElement?.isConnected?entry.sourceElement.getBoundingClientRect():entry.sourceRect||target;
  const cx=innerWidth/2-(target.left+target.width/2),cy=innerHeight/2-(target.top+target.height/2);
  const dx=source.left+source.width/2-(target.left+target.width/2),dy=source.top+source.height/2-(target.top+target.height/2);
  const sx=source.width/target.width,sy=source.height/target.height;
  const spin=orbit.animate([
   {transform:`translate3d(0,${draggedY}px,0) rotateY(0deg) scale(1)`,offset:0},
   {transform:`translate3d(${cx}px,${cy}px,0) rotateY(0deg) scale(1.05)`,offset:.2},
   {transform:`translate3d(${cx}px,${cy}px,0) rotateY(-70deg) scale(1.05)`,offset:.34},
   {transform:`translate3d(${cx}px,${cy}px,0) rotateY(-360deg) scale(1.05)`,offset:.6},
   {transform:`translate3d(${dx}px,${dy}px,0) rotateY(-720deg) scale(${sx},${sy})`,offset:1}
  ],{duration:1450,easing:'cubic-bezier(.25,.55,.3,1)',fill:'forwards'});
  entry.animations.push(spin);
  try{await spin.finished;}catch{};
  if(running.get(dialog)===entry&&dialog.open)dialog.close();
  return true;
 }
 window.ModalMotion={open,close,dismiss};
})();
