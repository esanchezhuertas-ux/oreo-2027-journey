/* Small event-driven foil controller. Works alongside CSS's independent scale. */
(()=>{'use strict';
  const mounted=new WeakSet();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=n=>Math.min(1,Math.max(0,n));
  function attach(card){
    if(mounted.has(card))return;
    mounted.add(card);
    let frame=0,box=null,x=.5,y=.4,tracking=false,touch=false;
    const surface=card.closest('.reveal-size')||card;
    const draw=()=>{
      frame=0;
      if(!card.isConnected)return;
      const s=card.style;
      const px=reduced.matches?.5:x,py=reduced.matches?.4:y;
      s.setProperty('--hx',(px*100).toFixed(2)+'%');
      s.setProperty('--hy',(py*100).toFixed(2)+'%');
      s.setProperty('--fx',(20+px*60).toFixed(2)+'%');
      s.setProperty('--fy',(20+py*60).toFixed(2)+'%');
      s.setProperty('--rx',((.5-py)*(touch?60:18)).toFixed(2)+'deg');
      s.setProperty('--ry',((px-.5)*(touch?72:24)).toFixed(2)+'deg');
      s.setProperty('--glow','1');
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(draw);};
    const start=()=>{
      box=surface.getBoundingClientRect();
      tracking=true;
      card.classList.add('holo-active');
    };
    const point=e=>{
      if(!tracking)start();
      x=clamp(.5+((e.clientX-box.left)/box.width-.5)*(touch?1.65:1));
      y=clamp(.5+((e.clientY-box.top)/box.height-.5)*(touch?1.65:1));
      schedule();
    };
    const reset=()=>{
      if(frame)cancelAnimationFrame(frame);
      frame=0;tracking=false;box=null;x=.5;y=.4;
      card.classList.remove('holo-active');
      card.style.setProperty('--rx','0deg');
      card.style.setProperty('--ry','0deg');
      card.style.setProperty('--glow',card.matches(':focus-visible')?'.45':'0');
    };
    surface.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch'){touch=false;start();point(e);}},{passive:true});
    surface.addEventListener('pointermove',e=>{if(e.pointerType!=='touch'||tracking)point(e);},{passive:true});
    surface.addEventListener('pointerdown',e=>{touch=e.pointerType==='touch';start();point(e);if(touch)surface.setPointerCapture(e.pointerId);},{passive:true});
    surface.addEventListener('pointerleave',reset,{passive:true});
    surface.addEventListener('pointercancel',reset,{passive:true});
    surface.addEventListener('pointerup',e=>{if(e.pointerType==='touch')reset();},{passive:true});
    card.addEventListener('focus',()=>{
      if(card.matches(':focus-visible')){x=.65;y=.3;start();schedule();}
    });
    card.addEventListener('blur',reset);
    card.addEventListener('keydown',e=>{
      const movement={ArrowLeft:[-.12,0],ArrowRight:[.12,0],ArrowUp:[0,-.12],ArrowDown:[0,.12]}[e.key];
      if(!movement)return;
      e.preventDefault();
      if(!tracking)start();
      x=clamp(x+movement[0]);y=clamp(y+movement[1]);schedule();
    });
  }
  window.Holo={init(root=document){
    if(root.matches?.('.holo-card'))attach(root);
    root.querySelectorAll('.holo-card').forEach(attach);
  }};
})();
