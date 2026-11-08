/* Two decorative copies fan out from the centre; only the front tracks the pointer. */
(()=>{'use strict';
 const mounted=new WeakMap();
 let serial=0;
 function copyFace(card,suffix){
  const face=card.querySelector('.card-face').cloneNode(true);
  face.querySelectorAll('.copies-overlay,.copies-clip,.holo-foil,.holo-glare,.holo-sparkles').forEach(el=>el.remove());
  const ids=new Map();
  face.querySelectorAll('[id]').forEach(el=>{
   const id=el.id,next=`${id}-${suffix}`;
   ids.set(id,next);el.id=next;
  });
  face.querySelectorAll('*').forEach(el=>{
   [...el.attributes].forEach(attribute=>{
    let value=attribute.value.replace(/url\(\s*(['"]?)#([^\s)'";]+)\1\s*\)/g,(match,quote,id)=>ids.has(id)?`url(#${ids.get(id)})`:match);
    if((attribute.name==='href'||attribute.name==='xlink:href')&&value.startsWith('#')&&ids.has(value.slice(1)))value=`#${ids.get(value.slice(1))}`;
    if(value!==attribute.value)el.setAttribute(attribute.name,value);
   });
  });
  return face;
 }
 function attach(card){
  if(card.hasAttribute('data-detail'))return;
  const type=card.classList.contains('gold')?'gold':'blue';
  const count=Math.max(0,Math.min(3,Number(card.dataset.available)||0)-1);
  const previous=mounted.get(card);
  if(previous?.count===count)return;
  previous?.element?.remove();
  if(!count){mounted.set(card,{count,element:null});return;}
  const stack=document.createElement('span');
  stack.className='copy-stack'+(type==='gold'?' copy-stack-gold':'');
  stack.setAttribute('aria-hidden','true');
  const suffix=`copy-${++serial}`;
  const positions=[[0,0,8,.72],[0,0,16,.42]];
  for(let depth=count;depth>0;depth--){
   const sheet=document.createElement('span');
   sheet.className=`copy-sheet ${type}`;
   const [x,y,angle,opacity]=positions[depth-1];
   sheet.style.setProperty('--copy-x',`${x}px`);
   sheet.style.setProperty('--copy-y',`${y}px`);
   sheet.style.setProperty('--copy-angle',`${angle}deg`);
   sheet.style.setProperty('--copy-opacity',opacity);
   sheet.style.setProperty('--biscuit-ink',card.style.getPropertyValue('--biscuit-ink')||(type==='gold'?'#f4d74c':'#0cbcff'));
   sheet.append(copyFace(card,`${suffix}-${depth}`));
   stack.append(sheet);
  }
  card.before(stack);
  mounted.set(card,{count,element:stack});
 }
 window.CopyStack={init(root=document){
  if(root.matches?.('.holo-card'))attach(root);
  root.querySelectorAll('.holo-card:not([data-detail])').forEach(attach);
 }};
})();
