/* Small event-driven foil controller. Works alongside CSS's independent scale. */
(()=>{'use strict';
  const mounted=new WeakSet();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=n=>Math.min(1,Math.max(0,n));
  function attach(card){
    if(mounted.has(card))return;
    mounted.add(card);
    let frame=0,box=null,x=.5,y=.4,tracking=false,touch=false;
    const reveal=!!card.closest('.reveal-spin');
    const surface=reveal?card.closest('.reveal-size'):card;
    let easedX=.5,easedY=.5,lastTime=0,drag=null;
    const draw=time=>{
      frame=0;
      if(!card.isConnected)return;
      const s=card.style;
      const damping=reveal&&!reduced.matches?1-Math.exp(-Math.min(50,lastTime?time-lastTime:16)/(tracking?48:95)):1;
      lastTime=time;
      easedX+=(x-easedX)*damping;
      easedY+=(y-easedY)*damping;
      const px=reduced.matches?.5:easedX,py=reduced.matches?.5:easedY;
      s.setProperty('--hx',(px*100).toFixed(2)+'%');
      s.setProperty('--hy',(py*100).toFixed(2)+'%');
      s.setProperty('--fx',(20+px*60).toFixed(2)+'%');
      s.setProperty('--fy',(20+py*60).toFixed(2)+'%');
      s.setProperty('--rx',((.5-py)*(reveal?84:touch?60:18)).toFixed(2)+'deg');
      s.setProperty('--ry',((px-.5)*(reveal?104:touch?72:24)).toFixed(2)+'deg');
      s.setProperty('--glow',tracking?'1':'0');
      if(Math.max(Math.abs(x-easedX),Math.abs(y-easedY))>.0005)frame=requestAnimationFrame(draw);
      else lastTime=0;
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(draw);};
    const start=()=>{
      box=surface.getBoundingClientRect();
      tracking=true;
      card.classList.add('holo-active');
    };
    const point=e=>{
      if(drag&&e.pointerId!==drag.id)return;
      if(!tracking)start();
      if(reveal){
        const ax=drag?drag.x+(e.clientX-drag.left)/box.width:(e.clientX-box.left)/box.width-.5;
        const ay=drag?drag.y+(e.clientY-drag.top)/box.height:(e.clientY-box.top)/box.height-.5;
        x=.5+.5*Math.sin(Math.PI*(clamp(.5+ax)-.5));
        y=.5+.5*Math.sin(Math.PI*(clamp(.5+ay)-.5));
        schedule();return;
      }
      const sensitivity=reveal?(touch?2.1:1.55):(touch?1.65:1);
      x=clamp(.5+((e.clientX-box.left)/box.width-.5)*sensitivity);
      y=clamp(.5+((e.clientY-box.top)/box.height-.5)*sensitivity);
      schedule();
    };
    const reset=()=>{
      drag=null;
      if(reveal){
        tracking=false;box=null;x=y=.5;card.classList.remove('holo-active');schedule();return;
      }
      if(frame)cancelAnimationFrame(frame);
      frame=0;tracking=false;box=null;x=.5;y=.4;
      card.classList.remove('holo-active');
      card.style.setProperty('--rx','0deg');
      card.style.setProperty('--ry','0deg');
      card.style.setProperty('--glow',card.matches(':focus-visible')?'.45':'0');
    };
    surface.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch'){start();point(e);}},{passive:true});
    surface.addEventListener('pointermove',e=>{if(e.pointerType!=='touch'||tracking)point(e);},{passive:true});
    surface.addEventListener('pointerdown',e=>{if(!e.isPrimary)return;
      touch=e.pointerType==='touch';start();
      if(touch&&reveal)drag={id:e.pointerId,left:e.clientX,top:e.clientY,x:Math.asin(2*easedX-1)/Math.PI,y:Math.asin(2*easedY-1)/Math.PI};
      point(e);if(touch)surface.setPointerCapture(e.pointerId);},{passive:true});
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
