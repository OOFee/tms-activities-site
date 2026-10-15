// Little surprises on the activity pages: pop the swimming bubbles and party balloons, click a page's title
// for a toy (soccer: a giant ball to kick about, tennis: balls fly across, spanish: it rains flags), and a chalk
// outline that draws itself round the member-discount card. Runs after chalk-scenes.js has built the scenery.
(() => {
  const page = (location.pathname.split('/').pop() || 'c.html').replace(/\.html$/, '');
  const reduce = window.TMS_LITE || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';

  const css = `
    .world .scenery .poppable { pointer-events: all; cursor: pointer; }
    .world .scenery .hit { fill: none; stroke: none; }
    .egg-word { display: inline-block; }
    .egg-title, .egg-word { cursor: pointer; -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; text-decoration: underline wavy rgba(245,243,236,0); text-decoration-thickness: 2px; text-underline-offset: .12em; transition: text-decoration-color .25s; }
    .egg-title:hover, .egg-word:hover { text-decoration-color: rgba(245,243,236,.6); }
    .egg-title { display: inline-block; transform-origin: 30% 70%; }
    .egg-title:hover, .egg-word:hover { animation: eggWig .55s ease-in-out; }
    @media (prefers-reduced-motion: reduce) { .egg-title:hover, .egg-word:hover { animation: none; } }
    .egg-hint { animation: eggWig .55s ease-in-out, eggLine 1.6s ease; }   /* once after load: "I'm clickable" */
    @keyframes eggLine { 0%, 100% { text-decoration-color: rgba(245,243,236,0); } 20%, 70% { text-decoration-color: rgba(245,243,236,.7); } }
    @keyframes eggWig { 25% { transform: rotate(-2.5deg) translateY(-2px); } 60% { transform: rotate(2deg); } 100% { transform: none; } }
    .egg-ball { position: absolute; z-index: 3; left: 0; top: 0; cursor: grab; touch-action: none; will-change: transform; }
    .egg-ball svg { width: 100%; height: 100%; display: block; overflow: visible; }
    .egg-sky { position: fixed; inset: 0; z-index: 56; pointer-events: none; overflow: hidden; }
    .egg-sky > * { position: absolute; left: 0; top: 0; will-change: transform; }
    .deal { position: relative; }
    .deal > .chalkline { position: absolute; inset: -9px; width: calc(100% + 18px); height: calc(100% + 18px); pointer-events: none; overflow: visible; }
    .chalkline path { fill: none; stroke: var(--grass, #2E6B3F); stroke-linecap: round; stroke-linejoin: round; }`;
  const st = document.createElement('style'); st.textContent = css; document.head.append(st);

  // sound: tiny synthesised pops, no files to load ----------------------------------------------------------------
  let ac;
  const audio = () => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) {} return ac; };
  function pop(kind) {
    const a = audio(); if (!a) return;
    const t = a.currentTime, out = a.createGain(); out.connect(a.destination);
    if (kind === 'bubble') {   // a quick rising "blup"
      const o = a.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(380 + Math.random() * 120, t); o.frequency.exponentialRampToValueAtTime(1500 + Math.random() * 300, t + .07);
      out.gain.setValueAtTime(.0001, t); out.gain.exponentialRampToValueAtTime(.35, t + .01); out.gain.exponentialRampToValueAtTime(.0001, t + .11);
      o.connect(out); o.start(t); o.stop(t + .12);
    } else {                   // balloon: a sharp burst of noise plus a little low thump
      const n = a.createBufferSource(), len = Math.floor(a.sampleRate * .18), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      n.buffer = buf;
      const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = .7;
      out.gain.setValueAtTime(1.1, t); out.gain.exponentialRampToValueAtTime(.0001, t + .16);
      n.connect(bp); bp.connect(out); n.start(t);
      const o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(50, t + .09);
      g.gain.setValueAtTime(.5, t); g.gain.exponentialRampToValueAtTime(.0001, t + .1); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + .11);
    }
  }

  // chalk burst drawn into the scenery where something popped
  function burst(svg, cx, cy, size) {
    const root = svg.querySelector('g[filter]') || svg, m = svg.getScreenCTM(); if (!m) return;
    const p = new DOMPoint(cx, cy).matrixTransform(m.inverse()), k = 1 / m.a;
    const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'k'); g.style.strokeWidth = 2.6;
    const rays = 9, parts = [];
    for (let i = 0; i < rays; i++) {
      const a = i / rays * Math.PI * 2 + Math.random() * .3, l = document.createElementNS(NS, 'path');
      l.setAttribute('class', 'k'); l.style.strokeWidth = 2.4; g.append(l); parts.push([l, Math.cos(a), Math.sin(a)]);
    }
    root.append(g);
    const t0 = performance.now(), dur = 380;
    (function step(now) {
      const u = Math.min(1, (now - t0) / dur), r0 = size * k * (.6 + u * 1.1), r1 = r0 + size * k * .55 * (1 - u * .6);
      for (const [l, c, s] of parts) l.setAttribute('d', `M${(p.x + c * r0).toFixed(1)} ${(p.y + s * r0).toFixed(1)} L${(p.x + c * r1).toFixed(1)} ${(p.y + s * r1).toFixed(1)}`);
      g.style.opacity = 1 - u * u;
      if (u < 1) requestAnimationFrame(step); else g.remove();
    })(t0);
  }

  // hide a looping SMIL piece until its loop comes round again
  function hideUntilNextLoop(svg, el, anim) {
    const dur = parseFloat(anim.getAttribute('dur')), beg = parseFloat(anim.getAttribute('begin')) || 0;
    const now = svg.getCurrentTime(), left = now < beg ? 0 : dur - ((now - beg) % dur);
    el.style.visibility = 'hidden';
    setTimeout(() => { el.style.visibility = ''; }, left * 1000 + 50);
  }

  const scenery = document.querySelector('.world .scenery svg');
  const hitR = (r) => Math.max(r * 2.2, r + 18);   // bubbles are small; give fingers and mice a generous target

  // swimming: pop the rising bubbles
  if (page === 'swimming' && scenery && !window.TMS_LITE) {
    scenery.querySelectorAll('circle').forEach(c => {
      if (!c.querySelector('animate[attributeName="cy"]')) return;
      // an invisible, bigger copy rides along on the same animation and takes the clicks
      const hit = c.cloneNode(true);
      hit.setAttribute('class', 'hit poppable'); hit.removeAttribute('style'); hit.setAttribute('r', hitR(+c.getAttribute('r')).toFixed(1));
      c.after(hit);
      hit.addEventListener('pointerdown', e => {
        const r = c.getBoundingClientRect();
        pop('bubble'); burst(scenery, r.left + r.width / 2, r.top + r.height / 2, Math.max(10, r.width * .7));
        hideUntilNextLoop(scenery, c, c.querySelector('animate')); hideUntilNextLoop(scenery, hit, hit.querySelector('animate'));
        e.stopPropagation();
      });
    });
  }

  // parties: pop the balloons
  if (page === 'parties' && scenery && !window.TMS_LITE) {
    scenery.querySelectorAll('ellipse[rx="26"]').forEach(el => {
      const bal = el.closest('g[data-at]'); if (!bal) return;
      const move = bal.querySelector(':scope > animateTransform');
      el.classList.add('poppable');
      el.addEventListener('pointerdown', e => {
        const r = el.getBoundingClientRect();
        pop('balloon'); burst(scenery, r.left + r.width / 2, r.top + r.height / 2, r.width * .9);
        if (move) hideUntilNextLoop(scenery, bal, move); else bal.style.visibility = 'hidden';
        e.stopPropagation();
      });
    });
  }

  // member discount card: a green chalk outline draws round it, then keeps being sketched over
  const deal = document.querySelector('.ccard.deal');
  if (deal) {
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'chalkline'); svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `<filter id="dealChalk" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" result="w"/>
        <feDisplacementMap in="SourceGraphic" in2="w" scale="3" xChannelSelector="R" yChannelSelector="G" result="l"/>
        <feTurbulence type="fractalNoise" baseFrequency="1.5" seed="3" result="g"/>
        <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2 1.6" result="a"/>
        <feComposite in="l" in2="a" operator="in"/></filter><g filter="url(#dealChalk)"><path class="a"/><path class="b"/><path class="c"/></g>`;
    deal.append(svg);
    const [pa, pb, pc] = svg.querySelectorAll('path');
    const wob = (w, h, j, seed) => {   // a hand-drawn rounded box, a little wobbly, starting top-left and overshooting
      const R = 18, rnd = (i) => (Math.sin(seed * 12.9 + i * 78.2) * 43758.5) % 1 * j;
      return `M${R + rnd(1)} ${4 + rnd(2)} L${w - R + rnd(3)} ${3 + rnd(4)} Q${w - 3} ${3} ${w - 4 + rnd(5)} ${R} L${w - 3 + rnd(6)} ${h - R + rnd(7)} ` +
        `Q${w - 3} ${h - 3} ${w - R + rnd(8)} ${h - 4} L${R + rnd(9)} ${h - 3 + rnd(10)} Q${3} ${h - 3} ${4 + rnd(11)} ${h - R} L${3 + rnd(12)} ${R + rnd(13)} Q${4} ${4} ${R + 20} ${5 + rnd(14)}`;
    };
    const star = (x, y, s) => `M${x} ${y - s} L${x + s * .3} ${y - s * .3} L${x + s} ${y} L${x + s * .3} ${y + s * .3} L${x} ${y + s} L${x - s * .3} ${y + s * .3} L${x - s} ${y} L${x - s * .3} ${y - s * .3} Z`;
    const size = () => {
      const w = deal.offsetWidth + 18, h = deal.offsetHeight + 18;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      pa.setAttribute('d', wob(w, h, 2.5, 1)); pb.setAttribute('d', wob(w, h, 4, 2)); pc.setAttribute('d', star(w - 26, 22, 11) + star(w - 52, 10, 6));
    };
    size(); new ResizeObserver(size).observe(deal);
    [pa, pb, pc].forEach(p => p.setAttribute('pathLength', '1'));
    pa.style.cssText = 'stroke-width:3;stroke-dasharray:1;stroke-dashoffset:1';
    pb.style.cssText = 'stroke-width:1.6;opacity:.55;stroke-dasharray:1;stroke-dashoffset:1';
    pc.style.cssText = 'stroke-width:2;fill:var(--grass,#2E6B3F);fill-opacity:0;stroke-dasharray:1;stroke-dashoffset:1';
    const go = () => {
      if (reduce) { [pa, pb, pc].forEach(p => p.style.strokeDashoffset = 0); pc.style.fillOpacity = .9; return; }
      pa.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 1400, easing: 'cubic-bezier(.55,.1,.45,1)', fill: 'forwards' });
      pc.animate([{ strokeDashoffset: 1, fillOpacity: 0 }, { strokeDashoffset: 0, fillOpacity: 0, offset: .7 }, { strokeDashoffset: 0, fillOpacity: .9 }], { duration: 700, delay: 1300, fill: 'forwards' });
      // the lighter second line keeps re-sketching itself round the box
      pb.animate([{ strokeDashoffset: 1, opacity: .55 }, { strokeDashoffset: 0, opacity: .55, offset: .45 }, { strokeDashoffset: 0, opacity: .55, offset: .8 }, { strokeDashoffset: 0, opacity: 0 }],
        { duration: 5200, delay: 1500, iterations: Infinity });
      pc.animate([{ transform: 'rotate(0deg) scale(1)' }, { transform: 'rotate(12deg) scale(1.15)' }, { transform: 'rotate(0deg) scale(1)' }],
        { duration: 2600, delay: 2000, iterations: Infinity, easing: 'ease-in-out' });
    };
    pc.style.transformBox = 'fill-box'; pc.style.transformOrigin = '50% 50%';
    new IntersectionObserver((es, io) => { if (es.some(e => e.isIntersecting)) { io.disconnect(); go(); } }, { threshold: .5 }).observe(deal);
  }

  // title toys ------------------------------------------------------------------------------------------------
  const title = document.querySelector('.world-copy h1');
  if (!title || window.TMS_LITE || !['soccer', 'tennis', 'spanish', 'swimming', 'parties'].includes(page)) return;   // these only move when you ask, so they run even with reduced motion
  if (page !== 'parties') title.classList.add('egg-title');
  if (!reduce) setTimeout(() => {
    const el = page === 'parties' ? title.querySelector('.egg-word') : title;
    if (!el || el.matches(':hover')) return;
    el.classList.add('egg-hint');
    el.addEventListener('animationend', e => { if (e.animationName === 'eggLine') el.classList.remove('egg-hint'); });
  }, innerWidth <= 700 ? 900 : 1500);
  title.addEventListener('mousedown', e => { if (e.detail > 1) e.preventDefault(); });
  let sky;
  const skyLayer = () => { if (!sky) { sky = document.createElement('div'); sky.className = 'egg-sky'; document.body.append(sky); } return sky; };

  // soccer: a giant chalk football drops into the hero; kick it, swipe it, throw it
  if (page === 'soccer') {
    const world = document.querySelector('.world'), balls = [];
    const ballSvg = (r) => `<svg viewBox="-60 -60 120 120"><defs><filter id="eggChalk${r}" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${r}" result="w"/>
        <feDisplacementMap in="SourceGraphic" in2="w" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="l"/>
        <feTurbulence type="fractalNoise" baseFrequency="1.6" seed="9" result="g"/>
        <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2 1.8" result="a"/>
        <feComposite in="l" in2="a" operator="in"/></filter></defs>
      <g filter="url(#eggChalk${r})" fill="none" stroke="#F5F3EC" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <circle r="55"/><path fill="#F5F3EC" fill-opacity=".85" d="M0 -20 L19 -6 L12 16 L-12 16 L-19 -6 Z"/>
        <path stroke-width="2.4" d="M0 -20 V-55 M19 -6 L52 -17 M12 16 L32 45 M-12 16 L-32 45 M-19 -6 L-52 -17"/>
        <path fill="#F5F3EC" fill-opacity=".85" d="M-8 -55 L0 -48 L8 -55 M44 -33 L52 -17 L55 -27 M38 41 L32 45 L23 52 M-38 41 L-32 45 L-23 52 M-44 -33 L-52 -17 L-55 -27"/></g></svg>`;
    let last = null, raf = 0;
    const tick = (now) => {
      const dt = Math.min(.033, (now - (last || now)) / 1000); last = now;
      const wr = world.getBoundingClientRect(), sheet = document.querySelector('.sheet');
      const W = wr.width, floorY = Math.min(wr.height, sheet ? sheet.getBoundingClientRect().top - wr.top + 6 : wr.height);
      for (const b of balls) {
        if (!b.held) {
          b.vy += 2600 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.y > floorY - b.r) { b.y = floorY - b.r; if (b.vy > 0) b.vy = Math.abs(b.vy) > 120 ? -b.vy * .62 : 0; b.vx *= Math.pow(.25, dt); }
          if (b.y < b.r && b.vy < 0) { b.y = b.r; b.vy = -b.vy * .5; }
          if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * .7; }
          if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * .7; }
          b.a += b.vx * dt / b.r;   // roll matches the distance travelled
        }
        // squash a little on the floor
        const sq = b.y >= floorY - b.r - 1 && !b.held ? Math.min(.12, Math.abs(b.vy) / 6000) : 0;
        b.el.style.transform = `translate(${b.x - b.r}px, ${b.y - b.r}px) scale(${1 + sq}, ${1 - sq})`;
        b.el.firstChild.style.transform = `rotate(${b.a}rad)`;
      }
      raf = requestAnimationFrame(tick);
    };
    const spawn = () => {
      if (balls.length >= 3) { balls.forEach(b => { b.vy = -1400; b.vx += (Math.random() - .5) * 600; }); return; }
      const wr = world.getBoundingClientRect(), r = Math.round(Math.min(110, Math.max(60, wr.width * .085)));
      const el = document.createElement('div'); el.className = 'egg-ball'; el.style.width = el.style.height = r * 2 + 'px';
      el.innerHTML = ballSvg(balls.length + 1);
      world.append(el);
      const tr = title.getBoundingClientRect();
      const b = { el, r, x: Math.min(wr.width - r, tr.right - wr.left + r), y: -r, vx: 260 + Math.random() * 200, vy: 0, a: 0, held: false };
      balls.push(b);
      let px = 0, py = 0, pt = 0, vx = 0, vy = 0, downX = 0, downY = 0, moved = false;
      el.addEventListener('pointerdown', e => {
        e.preventDefault(); el.setPointerCapture(e.pointerId); el.style.cursor = 'grabbing';
        b.held = true; moved = false; px = downX = e.clientX; py = downY = e.clientY; pt = performance.now(); vx = vy = 0;
      });
      el.addEventListener('pointermove', e => {
        const wr2 = world.getBoundingClientRect();
        if (!b.held) {   // a quick swipe through the ball knocks it
          if (e.movementX || e.movementY) {
            b.vx = Math.max(-2400, Math.min(2400, b.vx + e.movementX * 14));
            b.vy = Math.max(-2400, Math.min(b.vy, b.vy + e.movementY * 14) - 120);   // swiping up lifts it; any swipe gives a little hop
          }
          return;
        }
        const now = performance.now(), d = Math.max(8, now - pt);
        vx = vx * .5 + (e.clientX - px) / d * 1000 * .5; vy = vy * .5 + (e.clientY - py) / d * 1000 * .5;
        px = e.clientX; py = e.clientY; pt = now;
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) moved = true;
        if (moved) { b.x = e.clientX - wr2.left; b.y = e.clientY - wr2.top; b.a += (vx / b.r) * (d / 1000); }
      });
      const release = e => {
        if (!b.held) return;
        b.held = false; el.style.cursor = '';
        if (moved) { b.vx = vx; b.vy = vy; return; }   // thrown
        // a click is a kick: away from where you hit it, and up
        const wr2 = world.getBoundingClientRect(), dx = (wr2.left + b.x) - e.clientX, dy = (wr2.top + b.y) - e.clientY, l = Math.hypot(dx, dy) || 1;
        b.vx = dx / l * 1100 + (Math.random() - .5) * 200; b.vy = Math.min(-700, dy / l * 900 - 900);
      };
      el.addEventListener('pointerup', release); el.addEventListener('pointercancel', release);
      if (!raf) raf = requestAnimationFrame(tick);
    };
    title.addEventListener('click', spawn);
  }

  // the top edge of the light panel, in viewport pixels (things land on it)
  const panelTop = () => { const sh = document.querySelector('.sheet'); return sh ? sh.getBoundingClientRect().top : Infinity; };

  // tennis: each click sends a ball flying out over the hero to bounce along the panel; click faster and more come
  if (page === 'tennis') {
    let clicks = [], raf = 0, last = 0;
    const live = [];
    const tick = (now) => {
      const dt = Math.min(.033, (now - (last || now)) / 1000); last = now;
      const floor = panelTop(), W = innerWidth, H = innerHeight;
      sky.style.clipPath = `inset(0 0 ${Math.max(0, H - floor).toFixed(0)}px 0)`;   // nothing shows over the panel
      for (let i = live.length - 1; i >= 0; i--) {
        const b = live[i];
        b.vy += 1500 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.vx * dt / b.r;
        if (floor < H + b.r && b.y > floor - b.r && b.y < floor + b.r * 2) {   // bounce on the panel
          b.y = floor - b.r; b.vy = Math.abs(b.vy) > 160 ? -Math.abs(b.vy) * .7 : 0; b.vx *= .97;
        }
        b.el.style.transform = `translate(${b.x - b.r}px, ${b.y - b.r}px) rotate(${b.a}rad)`;
        if (b.x > W + 80 || b.x < -80 || b.y > H + 80) { b.el.remove(); live.splice(i, 1); }
      }
      raf = live.length ? requestAnimationFrame(tick) : 0;
    };
    const ball = () => {
      if (live.length > 60) return;
      const s = 30 + Math.random() * 16, el = document.createElement('div');
      el.innerHTML = `<svg width="${s}" height="${s}" viewBox="-20 -20 40 40" style="display:block;overflow:visible;filter:drop-shadow(0 6px 8px rgba(0,0,0,.3))">
        <circle r="18" fill="#D9EA3F"/><circle r="18" fill="none" stroke="#B9CB2A" stroke-width="1.5"/>
        <path d="M-12 -13 Q-3 0 -12 13 M12 -13 Q3 0 12 13" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>`;
      skyLayer().append(el);
      const tr = title.getBoundingClientRect(), ltr = Math.random() < .75;
      const b = ltr
        ? { x: tr.left + tr.width * .5, y: tr.top + tr.height * .4, vx: 450 + Math.random() * 650, vy: -(450 + Math.random() * 650) }
        : { x: innerWidth + 30, y: innerHeight * (.25 + Math.random() * .3), vx: -(500 + Math.random() * 500), vy: -(200 + Math.random() * 400) };
      Object.assign(b, { el, r: s / 2, a: 0 }); live.push(b);
      el.style.transform = `translate(${b.x - b.r}px, ${b.y - b.r}px)`;
      if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
    };
    title.addEventListener('click', () => {
      const now = performance.now(); clicks = clicks.filter(t => now - t < 1200); clicks.push(now);
      const n = Math.min(6, 1 + Math.floor((clicks.length - 1) / 1.5));
      for (let i = 0; i < n; i++) setTimeout(ball, i * 90);
    });
  }


  // swimming: every click sends up another wave of bubbles (poppable too)
  if (page === 'swimming' && scenery) {
    const root = scenery.querySelector('g[filter]') || scenery, live = [];
    let last = 0, raf = 0;
    const tick = (now) => {
      const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
      const top = scenery.viewBox.baseVal.y - 30;
      for (let i = live.length - 1; i >= 0; i--) {
        const b = live[i]; b.t += dt; b.y -= b.v * dt;
        const x = (b.x + Math.sin(b.t * b.f) * b.w).toFixed(1), y = b.y.toFixed(1);
        b.el.setAttribute('cx', x); b.el.setAttribute('cy', y); b.hit.setAttribute('cx', x); b.hit.setAttribute('cy', y);
        if (b.y < top || !b.el.isConnected) { b.el.remove(); b.hit.remove(); live.splice(i, 1); }
      }
      raf = live.length ? requestAnimationFrame(tick) : 0;
    };
    const bubble = () => {
      if (live.length > 160) return;
      const vb = scenery.viewBox.baseVal, el = document.createElementNS(NS, 'circle'), r = 5 + Math.random() * 11;
      el.setAttribute('class', 'k'); el.style.strokeWidth = 2; el.setAttribute('r', r.toFixed(1));
      const hit = document.createElementNS(NS, 'circle'); hit.setAttribute('class', 'hit poppable'); hit.setAttribute('r', hitR(r).toFixed(1));
      const b = { el, hit, x: vb.x + Math.random() * vb.width, y: vb.y + vb.height + 20, v: 110 + Math.random() * 140, t: Math.random() * 6, f: 2 + Math.random() * 2, w: 6 + Math.random() * 10 };
      hit.addEventListener('pointerdown', e => {
        const rc = el.getBoundingClientRect(); pop('bubble'); burst(scenery, rc.left + rc.width / 2, rc.top + rc.height / 2, Math.max(10, rc.width * .7));
        el.remove(); hit.remove(); e.stopPropagation();
      });
      root.append(el, hit); live.push(b);
      if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
    };
    title.addEventListener('click', () => { for (let i = 0; i < 16; i++) setTimeout(bubble, i * 70 + Math.random() * 500); });
  }

  // parties: clicking "Birthday" fires confetti out across the hero
  if (page === 'parties') {
    const world = document.querySelector('.world'), cv = document.createElement('canvas'), cx = cv.getContext('2d'), bits = [];
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:3;pointer-events:none';
    world.append(cv);
    const COLS = ['#F1BF00', '#F5F3EC', '#E85D75', '#5EC2E8', '#8BD17C', '#FF9F43'];
    let raf = 0, last = 0;
    const tick = (now) => {
      const dt = Math.min(.033, (now - (last || now)) / 1000); last = now;
      const dpr = devicePixelRatio || 1, W = world.clientWidth, H = world.clientHeight, floor = Math.min(H, panelTop() - world.getBoundingClientRect().top);
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = W * dpr; cv.height = H * dpr; }
      cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        b.vy += 900 * dt; b.vx *= Math.pow(.35, dt); b.vy *= Math.pow(.55, dt);   // air drag, so they float down
        if (!b.landed) {
          b.x += (b.vx + Math.sin(b.t * b.sw) * 40) * dt; b.y += b.vy * dt; b.a += b.va * dt;
          if (b.vy > 0 && b.y > floor - 2 && b.y < floor + 40) { b.y = floor - 2 - Math.random() * 3; b.landed = b.t; b.fl = 0; }   // lands flat on the panel
        } else b.y = floor - 2;
        b.t += dt;
        const fade = b.landed ? 1 - Math.max(0, b.t - b.landed - 1.5) / .8 : Math.min(1, (7 - b.t) * 2);
        if (b.y > H + 20 || b.t > 9 || fade <= 0) { bits.splice(i, 1); continue; }
        cx.save(); cx.translate(b.x, b.y); cx.rotate(b.a); cx.scale(1, b.landed ? .5 : Math.cos(b.t * b.fl));   // flips as it tumbles
        cx.globalAlpha = fade; cx.fillStyle = b.c;
        if (b.round) { cx.beginPath(); cx.arc(0, 0, b.s * .45, 0, Math.PI * 2); cx.fill(); } else cx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2);
        cx.restore();
      }
      raf = bits.length ? requestAnimationFrame(tick) : (cx.clearRect(0, 0, W, H), 0);
    };
    title.addEventListener('mousedown', e => { if (e.target.closest('.egg-word')) e.preventDefault(); });
    title.addEventListener('click', e => {
      const w = e.target.closest('.egg-word'); if (!w) return;
      const r = w.getBoundingClientRect(), wr = world.getBoundingClientRect(), ox = r.left + r.width / 2 - wr.left, oy = r.top + r.height / 2 - wr.top;
      for (let i = 0; i < 140 && bits.length < 600; i++) {
        const ang = -Math.PI / 2 + (Math.random() - .35) * 2.2, sp = 700 + Math.random() * 1100;   // a fan up and out, leaning right into the hero
        bits.push({ x: ox + (Math.random() - .5) * r.width * .6, y: oy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, t: Math.random() * .3,
          a: Math.random() * 6, va: (Math.random() - .5) * 14, fl: 4 + Math.random() * 8, sw: 2 + Math.random() * 3,
          s: 7 + Math.random() * 7, c: COLS[i % COLS.length], round: Math.random() < .2 });
      }
      if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
    });
  }

  // spanish: it rains little Spanish flags; they land on the panel, tip over, then fade. All drawn on one canvas
  // (cheap even with a hundred of them), and nothing is ever drawn below the panel's top edge
  if (page === 'spanish') {
    const cv = document.createElement('canvas'), cx = cv.getContext('2d'), live = [];
    cv.style.cssText = 'width:100vw;height:100vh';
    let raf = 0, last = 0;
    const flag = (f) => {   // drawn with the foot of the pole at the origin
      const w = f.w, ch = w * 2 / 3, h = ch * 1.7, sk = f.landed ? 0 : Math.sin(f.t * f.fl) * .12;
      cx.strokeStyle = '#6b5a3a'; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(0, -h); cx.stroke();
      cx.save(); cx.translate(1, -h); cx.transform(1, sk, 0, 1, 0, 0);
      cx.fillStyle = '#AA151B'; cx.fillRect(0, 0, w, ch);
      cx.fillStyle = '#F1BF00'; cx.fillRect(0, ch / 4, w, ch / 2);
      cx.restore();
    };
    const tick = (now) => {
      const dt = Math.min(.033, (now - (last || now)) / 1000); last = now;
      const dpr = devicePixelRatio || 1, W = innerWidth, H = innerHeight, floor = Math.min(H, panelTop());
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
      cx.save(); cx.beginPath(); cx.rect(0, 0, W, Math.max(0, floor)); cx.clip();
      for (let i = live.length - 1; i >= 0; i--) {
        const f = live[i]; f.t += dt;
        if (f.t < 0) continue;
        if (!f.landed) {
          f.vy = Math.min(f.vy + 300 * dt, f.max); f.y += f.vy * dt; f.x += Math.sin(f.t * f.sw) * f.dr * dt; f.a += f.va * dt;
          if (f.y >= floor && floor < H) { f.landed = f.t; f.y = floor; f.a0 = f.a; f.lie = -(66 + Math.random() * 18); }   // pole-first, cloth on top
        } else {
          const u = Math.min(1, (f.t - f.landed) / .35);
          f.a = f.a0 + (f.lie - f.a0) * (1 - Math.pow(1 - u, 3)); f.y = floor;
        }
        const alpha = f.landed ? 1 - Math.max(0, f.t - f.landed - 1.4) / .6 : 1;
        if (alpha <= 0 || f.y > H + 80) { live.splice(i, 1); continue; }
        cx.save(); cx.globalAlpha = alpha; cx.translate(f.x, f.y); cx.rotate(f.a * Math.PI / 180); flag(f); cx.restore();
      }
      cx.restore();
      raf = live.length ? requestAnimationFrame(tick) : (cx.clearRect(0, 0, W, H), 0);
    };
    title.addEventListener('click', () => {
      if (!cv.isConnected) skyLayer().append(cv);
      for (let i = 0; i < 45 && live.length < 120; i++) {
        const w = 26 + Math.random() * 22;
        live.push({ w, x: Math.random() * innerWidth, y: -10, vy: 60 + Math.random() * 60, max: 180 + Math.random() * 160, fl: 6 + Math.random() * 5,
          sw: 1.5 + Math.random() * 2, dr: 40 + Math.random() * 70, a: (Math.random() - .5) * 30, va: (Math.random() - .5) * 60, t: -(i * .055 + Math.random() * .4) });
      }
      if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
    });
  }
})();
