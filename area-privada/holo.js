/* Small event-driven foil controller. Works alongside CSS's independent scale. */
(()=>{'use strict';
  const mounted=new WeakSet();
  const previews=new WeakMap();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width: 760px)');
  const clamp=n=>Math.min(1,Math.max(0,n));
  function attach(card){
    if(mounted.has(card))return;
    mounted.add(card);
    let frame=0,box=null,x=.5,y=.4,tracking=false,touch=false;
    let touchOrigin=null,dragged=false;
    const surface=card.closest('.reveal-size')||card;
    const inPlayerDetail=card.matches('[data-detail]');
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
      s.setProperty('--foil-offset-x',((px-.5)*2).toFixed(2)+'px');
      s.setProperty('--foil-offset-y',((py-.5)*2).toFixed(2)+'px');
      const incidence=Math.abs(px-.5+(py-.5)*.32);
      const glint=1-Math.abs(incidence-.25)/.22;
      s.setProperty('--green-glint',Math.max(0,glint).toFixed(3));
      const distance=Math.min(1,2*Math.hypot(px-.5,py-.5));
      s.setProperty('--foil-distance',distance.toFixed(3));
      s.setProperty('--glow',touchOrigin&&!reduced.matches?(1+.18*Math.min(1,distance*2)).toFixed(3):'1');
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(draw);};
    const start=()=>{
      if(touchOrigin&&inPlayerDetail){
        // A new touch may arrive while the previous tilt is still easing back.
        // Measure the resting artwork so identical drags always have the same gain.
        const scale=parseFloat(getComputedStyle(card).scale)||1;
        box={width:card.offsetWidth*scale,height:card.offsetHeight*scale};
      }else{
        box=surface.getBoundingClientRect();
      }
      tracking=true;
      card.classList.add('holo-active');
    };
    const point=e=>{
      if(!tracking)start();
      if(touchOrigin){
        // A short drag tilts from the point of contact, even near a card edge.
        const dx=e.clientX-touchOrigin.x,dy=e.clientY-touchOrigin.y;
        if(Math.hypot(dx,dy)>8)dragged=true;
        x=clamp(.5+2.25*dx/box.width);
        y=clamp(.5+2.25*dy/box.height);
      }else{
        x=clamp(.5+((e.clientX-box.left)/box.width-.5)*(touch?1.65:1));
        y=clamp(.5+((e.clientY-box.top)/box.height-.5)*(touch?1.65:1));
      }
      schedule();
    };
    const reset=()=>{
      if(frame)cancelAnimationFrame(frame);
      frame=0;tracking=false;touch=false;touchOrigin=null;box=null;x=.5;y=.4;
      card.classList.remove('holo-active','holo-touch');
      card.style.setProperty('--rx','0deg');
      card.style.setProperty('--ry','0deg');
      card.style.setProperty('--glow',card.matches(':focus-visible')?'.45':'0');
    };
    previews.set(card,()=>{
      if(reduced.matches||tracking||!card.isConnected)return;
      const startTime=performance.now();
      function sweep(now){
        if(!card.isConnected||tracking)return;
        const progress=Math.min(1,(now-startTime)/1050);
        if(progress===1||reduced.matches){reset();return;}
        const envelope=Math.sin(Math.PI*progress);
        x=.5+.34*Math.sin(2*Math.PI*progress)*envelope;
        y=.5-.24*envelope;
        draw();
        card.style.setProperty('--glow',envelope.toFixed(3));
        requestAnimationFrame(sweep);
      }
      requestAnimationFrame(sweep);
    });
    surface.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch'){touch=false;start();point(e);}},{passive:true});
    const tracksPointer=e=>!touchOrigin||e.pointerId===touchOrigin.id;
    surface.addEventListener('pointermove',e=>{
      if(tracksPointer(e)&&(e.pointerType!=='touch'||tracking))point(e);
    },{passive:true});
    surface.addEventListener('pointerdown',e=>{
      if(!tracksPointer(e))return;
      dragged=false;
      touch=e.pointerType==='touch';
      if(touch&&mobile.matches){
        touchOrigin={id:e.pointerId,x:e.clientX,y:e.clientY};
        card.classList.add('holo-touch');
      }
      start();point(e);
      if(touch)surface.setPointerCapture(e.pointerId);
    },{passive:true});
    surface.addEventListener('pointerleave',e=>{if(tracksPointer(e))reset();},{passive:true});
    surface.addEventListener('pointercancel',e=>{if(tracksPointer(e))reset();},{passive:true});
    surface.addEventListener('pointerup',e=>{if(tracksPointer(e)&&e.pointerType==='touch')reset();},{passive:true});
    // A deliberate inspection gesture on a gallery card should not open its modal.
    surface.addEventListener('click',e=>{
      if(dragged&&e.detail>0){
        dragged=false;
        e.stopPropagation();
      }
    });
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
  window.Holo={preview(card){previews.get(card)?.();},init(root=document){
    if(root.matches?.('.holo-card'))attach(root);
    root.querySelectorAll('.holo-card').forEach(attach);
  }};
})();
