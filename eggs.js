// Little surprises on the activity pages: pop the swimming bubbles and party balloons, click a page's title
// for a toy (soccer: a giant ball to kick about, tennis: balls fly across, spanish: it rains flags), and a chalk
// outline that draws itself round the member-discount card. Runs after chalk-scenes.js has built the scenery.
(() => {
  const page = (location.pathname.split('/').pop() || 'c.html').replace(/\.html$/, '');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';

  const css = `
    .world .scenery .poppable { pointer-events: all; cursor: pointer; }
    .egg-title { cursor: pointer; -webkit-user-select: none; user-select: none; }
    .egg-title:active { transform: scale(.98); }
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

  // swimming: pop the rising bubbles
  if (page === 'swimming' && scenery) {
    scenery.querySelectorAll('circle').forEach(c => {
      if (!c.querySelector('animate[attributeName="cy"]')) return;
      c.classList.add('poppable');
      c.addEventListener('pointerdown', e => {
        const r = c.getBoundingClientRect();
        pop('bubble'); burst(scenery, r.left + r.width / 2, r.top + r.height / 2, Math.max(10, r.width * .7));
        hideUntilNextLoop(scenery, c, c.querySelector('animate'));
        e.stopPropagation();
      });
    });
  }

  // parties: pop the balloons
  if (page === 'parties' && scenery) {
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
  if (!title || reduce || !['soccer', 'tennis', 'spanish'].includes(page)) return;
  title.classList.add('egg-title');
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

  // tennis: each click sends a ball flying across the screen; click faster and more come
  if (page === 'tennis') {
    let clicks = [];
    const ball = (delay) => {
      const s = 30 + Math.random() * 16, el = document.createElement('div');
      el.innerHTML = `<svg width="${s}" height="${s}" viewBox="-20 -20 40 40" style="display:block;overflow:visible;filter:drop-shadow(0 6px 8px rgba(0,0,0,.3))">
        <circle r="18" fill="#D9EA3F"/><circle r="18" fill="none" stroke="#B9CB2A" stroke-width="1.5"/>
        <path d="M-12 -13 Q-3 0 -12 13 M12 -13 Q3 0 12 13" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>`;
      skyLayer().append(el);
      const W = innerWidth, H = innerHeight, ltr = Math.random() < .75, tr = title.getBoundingClientRect();
      const x0 = ltr ? tr.left + tr.width * .5 : W + 40, y0 = ltr ? tr.top + tr.height * .5 : H * (.3 + Math.random() * .4);
      const x1 = ltr ? W + 60 : -60, y1 = H * (.2 + Math.random() * .7), peak = Math.min(y0, y1) - H * (.15 + Math.random() * .35);
      const steps = 14, frames = [];
      for (let i = 0; i <= steps; i++) {
        const u = i / steps, x = x0 + (x1 - x0) * u, y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * peak + u * u * y1;
        frames.push({ transform: `translate(${x - s / 2}px, ${y - s / 2}px) rotate(${(ltr ? 1 : -1) * u * 900}deg)` });
      }
      const dur = 900 + Math.random() * 700;
      const a = el.animate(frames, { duration: dur, delay, easing: 'cubic-bezier(.2,.6,.6,1)', fill: 'both' });
      a.onfinish = () => el.remove();
    };
    title.addEventListener('click', () => {
      const now = performance.now(); clicks = clicks.filter(t => now - t < 1200); clicks.push(now);
      const n = Math.min(6, 1 + Math.floor((clicks.length - 1) / 1.5));
      for (let i = 0; i < n; i++) ball(i * 90);
    });
  }

  // spanish: it rains little Spanish flags
  if (page === 'spanish') {
    let live = 0;
    const flag = (delay) => {
      if (live > 220) return;
      live++;
      const w = 26 + Math.random() * 22, h = w * 2 / 3, el = document.createElement('div');
      el.innerHTML = `<svg width="${w}" height="${h + 14}" viewBox="0 -2 30 34" style="display:block;overflow:visible;filter:drop-shadow(0 3px 4px rgba(0,0,0,.25))">
        <path d="M1 -2 V32" stroke="#6b5a3a" stroke-width="1.6" stroke-linecap="round"/>
        <g><rect x="1.5" y="0" width="28" height="5" fill="#AA151B"/><rect x="1.5" y="5" width="28" height="10" fill="#F1BF00"/><rect x="1.5" y="15" width="28" height="5" fill="#AA151B"/>
        <animateTransform attributeName="transform" type="skewY" values="0;-6;0;5;0" dur="${(.8 + Math.random() * .6).toFixed(2)}s" repeatCount="indefinite"/></g></svg>`;
      skyLayer().append(el);
      const x = Math.random() * innerWidth, drift = (Math.random() - .5) * 220, H = innerHeight + 80, spin = (Math.random() - .5) * 120;
      const dur = 2600 + Math.random() * 2600;
      const a = el.animate([
        { transform: `translate(${x}px, -60px) rotate(${spin * .2}deg)` },
        { transform: `translate(${x + drift * .5 + 30}px, ${H * .35}px) rotate(${-spin * .4}deg)` },
        { transform: `translate(${x + drift * .8 - 20}px, ${H * .7}px) rotate(${spin * .6}deg)` },
        { transform: `translate(${x + drift}px, ${H}px) rotate(${spin}deg)` }
      ], { duration: dur, delay, easing: 'linear', fill: 'both' });
      a.onfinish = () => { el.remove(); live--; };
    };
    title.addEventListener('click', () => { for (let i = 0; i < 45; i++) flag(i * 55 + Math.random() * 400); });
  }
})();
