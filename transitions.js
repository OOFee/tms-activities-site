const NP = (s) => '/' + ((String(s).split('/').pop() || 'c.html').replace(/^index\.html$/, 'c.html'));
// Colour-wipe page transitions — ONLY for the big activity boxes (.tile links).
// Nav/pill and ordinary links navigate plainly. Departure: overlay expands from
// the click point in the destination's world colour. Arrival: an inline <head>
// script painted the same colour before first paint (html.pt-cover::before);
// here we fade it away once the hero image is ready, so nothing flashes.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const COLORS = {
    '/soccer.html': '#2E5940',
    '/swimming.html': '#275E7E',
    '/tennis.html': '#3F6A4C',
    '/spanish.html': '#9C4532',
    '/parties.html': '#7E4668',
  };
  // pages the nav pill can fade to (activity worlds plus the dark pages)
  const NAV_COLORS = Object.assign({}, COLORS, {
    '/coaches.html': '#152019', '/supporters.html': '#233A63', '/faq.html': '#3A4250',
    '/join.html': '#152019', '/c.html': '#152019', '/': '#152019',
  });

  // ---- arrival: reveal once the hero image is decoded (capped at 1s) ----
  const docEl = document.documentElement;
  if (docEl.classList.contains('pt-cover')) {
    let revealed = false;
    const reveal = () => {
      if (revealed) return; revealed = true;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        docEl.classList.add('pt-reveal');
        setTimeout(() => {
          docEl.classList.remove('pt-cover', 'pt-reveal');
          const st = document.getElementById('pt-cover-style');
          if (st) st.remove();
        }, 720);
      }));
    };
    const cap = setTimeout(reveal, 1000);
    const hero = document.querySelector('.hero img, .world-photo img');
    if (hero && !hero.complete) {
      hero.addEventListener('load', () => { clearTimeout(cap); reveal(); }, { once: true });
      hero.addEventListener('error', () => { clearTimeout(cap); reveal(); }, { once: true });
    } else {
      clearTimeout(cap);
      reveal();
    }
  }

  // ---- arrival after a nav-pill click: hero is already the right colour, content fades in ----
  if (docEl.classList.contains('pt-fade')) {
    const st = document.getElementById('pt-fade-style');
    const reveal = () => requestAnimationFrame(() => requestAnimationFrame(() => {
      if (st) st.textContent += 'html .world>*,html .sheet>*,html footer,html .hero>*{transition:opacity .6s ease}';
      docEl.classList.remove('pt-fade');
      setTimeout(() => st && st.remove(), 600);
    }));
    // coming from the homepage (no panel there), this page's panel glides up straight away; its content
    // fades in once the photo and fonts are ready
    const sheet = docEl.classList.contains('pt-from-home') && document.querySelector('.sheet');
    if (sheet) requestAnimationFrame(() => requestAnimationFrame(() => {
      const under = [docEl, document.body];
      const bg = getComputedStyle(document.querySelector('.world') || document.body).backgroundColor;
      under.forEach(el => el.style.backgroundColor = bg);   // the gap under the banner matches it until the panel arrives
      sheet.style.transition = 'transform .9s cubic-bezier(.16,1,.3,1)';
      docEl.classList.remove('pt-from-home');
      setTimeout(() => { sheet.style.transition = ''; under.forEach(el => el.style.backgroundColor = ''); }, 950);
    }));
    else docEl.classList.remove('pt-from-home');
    // wait for the web fonts as well, so text doesn't reflow (jiggle) while it fades in
    const show = () => Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 600))]).then(reveal);
    const img = document.querySelector('.world-photo img, .hero img');
    if (img && !img.complete) {
      const cap = setTimeout(show, 700);
      const go = () => { clearTimeout(cap); show(); };
      img.addEventListener('load', go, { once: true }); img.addEventListener('error', go, { once: true });
    } else show();
  }

  // ---- departure: expanding colour wipe, activity boxes only ----
  const overlay = document.createElement('div');
  overlay.id = 'pt-overlay';
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:290;pointer-events:none;background:#152019;' +
    'clip-path:circle(0px at 50% 50%);';
  document.documentElement.appendChild(overlay);

  let leaving = false;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a.tile[href]');          // only the big boxes
    if (!a || leaving || a.target || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    let u;
    try { u = new URL(a.getAttribute('href'), document.baseURI); } catch { return; }
    if (u.origin !== location.origin) return;
    if (NP(u.pathname) === NP(location.pathname)) return;
    const color = COLORS[NP(u.pathname)];
    if (!color) return;                                   // unknown target: navigate plainly

    e.preventDefault();
    leaving = true;
    const x = e.clientX || innerWidth / 2, y = e.clientY || innerHeight / 2;
    overlay.style.background = color;
    overlay.style.transition = 'none';
    overlay.style.opacity = '1';
    overlay.style.clipPath = `circle(0px at ${x}px ${y}px)`;
    overlay.getBoundingClientRect();                      // commit start state
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    overlay.style.transition = 'clip-path .55s cubic-bezier(.3,0,.3,1)';
    overlay.style.clipPath = `circle(${r + 60}px at ${x}px ${y}px)`;
    sessionStorage.setItem('ptColor', color);
    // navigate while the wipe is finishing so the colour never breaks
    setTimeout(() => { location.href = u.href; }, 430);
  });

  // ---- nav pill: if you're near the top, glide back up; the hero's colour washes to the next page's
  //      while everything inside it fades out, and the next page fades its content in ----
  document.addEventListener('click', (e) => {
    const a = e.target.closest('body > header a[href]');      // nav bar on every page, homepage included
    if (!a || leaving || a.target || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    let u;
    try { u = new URL(a.getAttribute('href'), document.baseURI); } catch { return; }
    if (u.origin !== location.origin || NP(u.pathname) === NP(location.pathname)) return;
    const color = NAV_COLORS[NP(u.pathname)];
    if (!color || scrollY > innerHeight) return;            // far down the page: navigate plainly

    e.preventDefault();
    leaving = true;
    const fade = () => {
      const world = document.querySelector('.world');
      if (world) {
        const parts = [...world.children];
        // the light panel keeps its shape; only what's inside it fades
        for (let n = world.nextElementSibling; n; n = n.nextElementSibling) parts.push(...(n.classList.contains('sheet') ? n.children : [n]));
        parts.forEach(el => { el.style.transition = 'opacity .35s ease'; el.style.opacity = '0'; });
        // the homepage has no panel at the top, so ours slides away down the screen instead of popping out
        const home = !NAV_COLORS[NP(u.pathname)] || NP(u.pathname) === '/' || NP(u.pathname) === '/c.html';
        const sheet = document.querySelector('.sheet');
        if (home && sheet) {
          // paint the page behind it the same colour so no light strip shows as it leaves
          [document.documentElement, document.body].forEach(el => { el.style.transition = 'background-color .3s ease'; el.style.backgroundColor = color; });
          sheet.style.transition = 'transform .45s cubic-bezier(.5,0,.75,0)'; sheet.style.transform = `translateY(${innerHeight}px)`;
        }
        world.style.transition = 'background-color .45s ease';
        world.style.backgroundColor = color;
        sessionStorage.setItem('ptFade', '1');
        setTimeout(() => { location.href = u.href; }, 470);
        return;
      }
      // homepage: its photo hero washes over in the next page's colour while the headline and chalk fade
      const hero = document.querySelector('.hero');
      if (hero) {
        sessionStorage.setItem('ptFade', 'home'); sessionStorage.setItem('ptHome', color);
        [...hero.children].forEach(el => { el.style.transition = 'opacity .35s ease'; el.style.opacity = '0'; });
        const wash = document.createElement('div');
        wash.style.cssText = `position:absolute;inset:0;z-index:5;background:${color};opacity:0;transition:opacity .45s ease;pointer-events:none`;
        hero.append(wash); wash.getBoundingClientRect(); wash.style.opacity = '1';
        setTimeout(() => { location.href = u.href; }, 470);
        return;
      }
      overlay.style.transition = 'none';
      overlay.style.background = color;
      overlay.style.clipPath = 'none';
      overlay.style.opacity = '0';
      overlay.getBoundingClientRect();
      overlay.style.transition = 'opacity .45s ease';
      overlay.style.opacity = '1';
      sessionStorage.setItem('ptColor', color);
      setTimeout(() => { location.href = u.href; }, 470);
    };
    if (scrollY < 4) return fade();
    scrollTo({ top: 0, behavior: 'smooth' });
    const t0 = performance.now();
    const wait = () => (scrollY < 4 || performance.now() - t0 > 700) ? fade() : requestAnimationFrame(wait);
    requestAnimationFrame(wait);
  });

  // restore if the page is shown again from bfcache
  addEventListener('pageshow', (ev) => {
    if (ev.persisted) {
      leaving = false;
      overlay.style.transition = 'none';
      overlay.style.clipPath = 'circle(0px at 50% 50%)';
      overlay.style.opacity = '';
      document.querySelectorAll('.world, .world > *, .world ~ *, .sheet > *').forEach(el => { el.style.opacity = ''; el.style.backgroundColor = ''; el.style.transform = ''; });
      [document.documentElement, document.body].forEach(el => el.style.backgroundColor = '');
      document.querySelectorAll('.hero > *').forEach(el => { el.style.opacity = ''; });
      docEl.classList.remove('pt-cover', 'pt-reveal');
    }
  });
})();

// mobile menu toggle
(() => {
  const header = document.querySelector('header.pill') || document.querySelector('header');
  const btn = header && header.querySelector('.navtoggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const open = header.classList.toggle('open');
    btn.textContent = open ? 'Close' : 'Menu';
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  header.addEventListener('click', (e) => {
    if (e.target.closest('nav a')) { header.classList.remove('open'); btn.textContent = 'Menu'; }
  });
})();

// touch screens: tiles play their hover animation as they scroll into view
(() => {
  if (!matchMedia('(hover: none), (max-width: 700px)').matches) return;
  const tiles = document.querySelectorAll('.tile');
  if (!tiles.length) return;
  // clone every ".tile … :hover" rule so ".play" triggers the same animation
  for (const sheet of [...document.styleSheets]) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    for (let i = 0, n = rules.length; i < n; i++) {
      const r = rules[i];
      if (!r.selectorText || !r.selectorText.includes(':hover') || !r.selectorText.includes('.tile')) continue;
      const sel = r.selectorText.split(',')
        .filter(s => s.includes(':hover') && s.includes('.tile'))
        .map(s => s.replaceAll(':hover', '.play')).join(',');
      if (sel) { try { sheet.insertRule(sel + '{' + r.style.cssText + '}', rules.length); } catch {} }
    }
  }
  const io = new IntersectionObserver((es) => {
    es.forEach(e => e.target.classList.toggle('play', e.intersectionRatio >= 0.6));
  }, { threshold: [0, 0.6, 1] });
  tiles.forEach(t => io.observe(t));
})();

// sport heroes: scenery draws itself in on page load
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const svgs = document.querySelectorAll('.world .scenery svg');
  if (!svgs.length) return;
  let delay = 350;
  svgs.forEach((svg) => {
    svg.querySelectorAll('path, ellipse, circle, line, rect').forEach((el) => {
      const fill = el.getAttribute('fill') || (el.closest('[fill]') && el.closest('[fill]').getAttribute('fill')) || 'none';
      if (fill !== 'none') {
        el.animate(
          [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }],
          { duration: 500, delay, easing: 'ease', fill: 'backwards' });
        delay += 90;
      } else {
        el.setAttribute('pathLength', '1');
        el.style.strokeDasharray = '1';
        el.animate(
          [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
          { duration: 800, delay, easing: 'cubic-bezier(.45,0,.4,1)', fill: 'backwards' });
        delay += 240;
      }
    });
  });
})();
