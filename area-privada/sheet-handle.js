(() => {
  'use strict';

  const mounted = new WeakMap();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function mount(panel, onDismiss) {
    if (!panel || mounted.has(panel)) return;
    const handle = document.createElement('span');
    handle.className = 'sheet-handle';
    // The close or cancel button is the keyboard and screen reader alternative.
    handle.setAttribute('aria-hidden', 'true');
    handle.append(document.createElement('span'));
    panel.prepend(handle);

    let drag = null;
    let rebound = null;
    let offset = 0;

    function reset(animate = true) {
      const previousOffset = offset;
      const pointerId = drag?.id;
      drag = null;
      offset = 0;
      if (pointerId != null && handle.hasPointerCapture(pointerId)) {
        handle.releasePointerCapture(pointerId);
      }
      rebound?.cancel();
      rebound = null;
      panel.style.removeProperty('translate');
      if (animate && previousOffset > 0 && !reducedMotion.matches && panel.animate) {
        rebound = panel.animate(
          [{translate: '0 ' + previousOffset + 'px'}, {translate: '0 0'}],
          {duration: 160, easing: 'ease-out'}
        );
      }
    }

    mounted.set(panel, reset);
    // A native dialog may be closed externally and reopened using the same DOM.
    if (panel.tagName === 'DIALOG') panel.addEventListener('close', () => reset(false));

    handle.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || drag || panel.dataset.closing ||
          panel.classList.contains('modal-intro') || panel.closest('[inert]')) return;
      // Continue from the visible position if the user grabs a returning sheet.
      const returning = rebound?.playState === 'running';
      offset = returning ? parseFloat(getComputedStyle(panel).translate.split(' ')[1]) || 0 : 0;
      rebound?.cancel();
      if (offset) panel.style.translate = '0 ' + offset + 'px';
      drag = {id: event.pointerId, x: event.clientX, y: event.clientY, startOffset: offset,
        lastY: event.clientY, lastTime: event.timeStamp, speed: 0};
      handle.setPointerCapture(event.pointerId);
    });

    function update(event) {
      const dy = event.clientY - drag.y;
      if (event.clientY !== drag.lastY) {
        drag.speed = (event.clientY - drag.lastY) / Math.max(1, event.timeStamp - drag.lastTime);
        drag.lastY = event.clientY;
        drag.lastTime = event.timeStamp;
      }
      offset = Math.max(0, drag.startOffset + dy);
      panel.style.translate = '0 ' + offset + 'px';
      return dy;
    }

    handle.addEventListener('pointermove', event => {
      if (drag?.id === event.pointerId) update(event);
    });
    handle.addEventListener('pointerup', event => {
      if (drag?.id !== event.pointerId) return;
      const dy = update(event);
      const vertical = dy > Math.abs(event.clientX - drag.x);
      const flick = dy > 24 && drag.speed > 0.5 && event.timeStamp - drag.lastTime < 100;
      if (vertical && (dy > 88 || flick)) {
        drag = null;
        onDismiss(offset);
      } else {
        reset();
      }
    });
    const cancel = event => { if (drag?.id === event.pointerId) reset(); };
    handle.addEventListener('pointercancel', cancel);
    handle.addEventListener('lostpointercapture', cancel);
  }

  window.SheetHandle = {mount, reset: panel => mounted.get(panel)?.()};
})();
