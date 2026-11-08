(() => {
  function language() {
    return document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'es';
  }

  function localize(footer, lang) {
    const english = lang === 'en';
    const current = english ? 'English' : 'Español';
    for (const text of footer.querySelectorAll('[data-of-en]')) {
      text.dataset.ofEs ??= text.textContent;
      text.textContent = english ? text.dataset.ofEn : text.dataset.ofEs;
    }
    footer.querySelector('[data-of-current]').textContent = current;
    footer.querySelector('.of-toggle').setAttribute('aria-label', (english ? 'Language: ' : 'Idioma: ') + current);
    footer.querySelector('.of-options').setAttribute('aria-label', english ? 'Language' : 'Idioma');
    footer.querySelector('.of-links').setAttribute('aria-label', english ? 'Legal information' : 'Información legal');
    for (const option of footer.querySelectorAll('[data-of-lang]')) {
      option.setAttribute('aria-checked', String(option.dataset.ofLang === lang));
    }
  }

  function openMenu(footer, open, restoreFocus = false) {
    const trigger = footer.querySelector('.of-toggle');
    const menu = footer.querySelector('.of-options');
    trigger.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    if (open) menu.querySelector('[aria-checked="true"]').focus({preventScroll:true});
    else if (restoreFocus) trigger.focus({preventScroll:true});
  }

  document.addEventListener('click', event => {
    const target = event.target;
    document.querySelectorAll('[data-oreo-footer]').forEach(footer => {
      if (target.closest('.of-toggle') === footer.querySelector('.of-toggle')) {
        openMenu(footer, footer.querySelector('.of-options').hidden);
        return;
      }
      const option = target.closest('[data-of-lang]');
      if (option && footer.contains(option)) {
        const lang = option.dataset.ofLang;
        openMenu(footer, false, true);
        document.documentElement.lang = lang;
        localize(footer, lang);
        document.dispatchEvent(new CustomEvent('oreo:language', {detail:lang, bubbles:true}));
        return;
      }
      openMenu(footer, false);
    });
  });

  document.addEventListener('keydown', event => {
    const footer = event.target.closest('[data-oreo-footer]');
    if (!footer || !event.target.closest('.of-language')) return;
    const options = [...footer.querySelectorAll('[data-of-lang]')];
    const menu = footer.querySelector('.of-options');
    if (event.key === 'Escape' && !menu.hidden) {
      event.preventDefault();
      openMenu(footer,false,true);
    } else if (['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
      event.preventDefault();
      if (menu.hidden) { openMenu(footer,true); return; }
      const idx = options.indexOf(document.activeElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length-1 : (idx + options.length + (event.key==='ArrowDown'?1:-1)) % options.length;
      options[next].focus({preventScroll:true});
    }
  });

  document.addEventListener('focusout', event => {
    const container = event.target.closest('.of-language');
    if (container && !container.contains(event.relatedTarget)) openMenu(container.closest('[data-oreo-footer]'),false);
  });
  function sync() {
    document.querySelectorAll('[data-oreo-footer]').forEach(footer => localize(footer,language()));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',sync,{once:true});
  else sync();
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
