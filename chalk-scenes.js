// Chalk hero scenes for the activity pages. Each page's .world .scenery is redrawn as a chalk scene that
// draws itself in on load, then keeps a gentle loop going in the open areas around the text and photo.
// Coordinates are a 1440×900 board anchored to the bottom of the hero (text sits top-left, photo right).
(() => {
  let svg = document.querySelector('.world .scenery svg');
  const box = document.querySelector('.world .scenery');
  if (!svg && box) { svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 1440 900'); svg.setAttribute('preserveAspectRatio', 'xMidYMax slice'); svg.setAttribute('aria-hidden', 'true'); box.append(svg); }
  if (!svg) return;
  const page = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '').replace(/^index$|^$/, 'c');
  const reduce = window.TMS_LITE || matchMedia('(prefers-reduced-motion: reduce)').matches;

  const css = `
    .world .scenery.chalked { opacity: .78; }
    .chalked .k { fill: none; stroke: #F5F3EC; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
    .chalked .kf { fill: #F5F3EC; }
    .chalked .cd { stroke-dasharray: 1; stroke-dashoffset: 1; animation: kDraw var(--dur, 1s) cubic-bezier(.55,.1,.45,1) var(--del, .2s) forwards; }
    .chalked .cf { opacity: 0; transform-box: fill-box; transform-origin: 50% 0; animation: kDrop .6s cubic-bezier(.34,1.4,.6,1) var(--del, .2s) forwards; }
    .chalked .fade { opacity: 0; animation: kFade .8s ease var(--del, .2s) forwards; }
    .chalked .drift { animation: kDrift var(--dur, 9s) linear infinite; }
    .chalked .word { font-family: "Caveat", cursive; font-weight: 600; fill: #F5F3EC; opacity: 0;
      clip-path: inset(-30% 100% -30% 0); animation: kWrite var(--cyc, 12s) linear var(--del, 0s) infinite; }
    .chalked .word.faint { fill-opacity: .45; }
    .chalked .word.once { animation: kWriteOnce var(--dur, 1s) linear var(--del, 0s) forwards; }
    @keyframes kWriteOnce { 0% { opacity: 1; clip-path: inset(-30% 100% -30% 0); } 100% { opacity: 1; clip-path: inset(-30% 0 -30% 0); } }
    @keyframes kDraw { to { stroke-dashoffset: 0; } }
    @keyframes kDrop { from { opacity: 0; transform: translateY(-16px) rotate(-8deg); } to { opacity: 1; transform: none; } }
    @keyframes kFade { to { opacity: 1; } }
    @keyframes kDrift { to { transform: translateX(-1440px); } }
    @keyframes kWrite {
      0% { opacity: 1; clip-path: inset(-30% 100% -30% 0); }
      7% { opacity: 1; clip-path: inset(-30% 0 -30% 0); }
      18% { opacity: 1; clip-path: inset(-30% 0 -30% 0); }
      22%, 100% { opacity: 0; clip-path: inset(-30% 0 -30% 0); }
    }
    @media (max-width: 700px) {
      .world .scenery.chalked { inset: 0; height: auto; }
      .world .scenery.chalked svg { width: 100%; margin-left: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .chalked .cd, .chalked .cf, .chalked .fade { animation: none; stroke-dashoffset: 0; opacity: 1; }
      .chalked .drift { animation: none; }
      .chalked .word { animation: none; opacity: 1; clip-path: none; }
    }
    html.lite .chalked .cd, html.lite .chalked .cf, html.lite .chalked .fade { animation: none; stroke-dashoffset: 0; opacity: 1; }
    html.lite .chalked .drift { animation: none; }
    html.lite .chalked .word { animation: none; opacity: 1; clip-path: none; }`;
  const style = document.createElement('style'); style.textContent = css; document.head.append(style);

  // helpers ------------------------------------------------------------------------------------
  let t = .2;
  const draw = (d, dur = .9, extra = '') => { const s = `<path class="k cd" pathLength="1" style="--del:${t.toFixed(2)}s;--dur:${dur}s" ${extra} d="${d}"/>`; t += dur * .55; return s; };
  const wave = (y, amp, w = 2880) => { let d = `M0 ${y}`; for (let x = 0; x < w; x += 120) d += ` q30 ${-amp} 60 0 t60 0`; return d; };
  const loop = (dur, extra = '') => `dur="${dur}s" begin="${t.toFixed(2)}s" repeatCount="indefinite" ${extra}`;
  const ball = (r) => `<circle class="k" r="${r}"/><path class="kf" d="M0 ${-r * .36} L${r * .34} ${-r * .11} L${r * .21} ${r * .29} L${-r * .21} ${r * .29} L${-r * .34} ${-r * .11} Z"/>
      <path class="k" style="stroke-width:2" d="M0 ${-r * .36} V${-r} M${r * .34} ${-r * .11} L${r * .95} ${-r * .3} M${r * .21} ${r * .29} L${r * .58} ${r * .8} M${-r * .21} ${r * .29} L${-r * .58} ${r * .8} M${-r * .34} ${-r * .11} L${-r * .95} ${-r * .3}"/>`;

  const scenes = {
    // pitch lines draw in; then a ball weaves through cones along the bottom and is slotted into a goal, on a loop
    soccer() {
      const pitch = draw('M310 900 L560 520 H880 L1130 900', 1.2) + draw('M430 900 L600 640 H840 L1010 900', 1) +
        draw('M160 760 H1280', .8) + `<ellipse class="k cd" pathLength="1" style="--del:${(t += .3).toFixed(2)}s" cx="720" cy="762" rx="150" ry="34"/>`;
      const cones = [300, 500, 700].map(x => draw(`M${x - 14} 818 L${x} 790 L${x + 14} 818 Z M${x - 20} 818 H${x + 20}`, .3)).join('');
      const goal = draw('M 1316 842 V 730 H 1424 V 842', .6) + draw('M 1334 730 V 842 M 1352 730 V 842 M 1370 730 V 842 M 1388 730 V 842 M 1406 730 V 842 M 1316 758 H 1424 M 1316 786 H 1424 M 1316 814 H 1424', .7, 'style="stroke-width:1.4"');
      const path = 'M -40 800 C 100 800 200 760 300 760 S 440 840 500 840 S 640 760 700 760 S 860 832 960 824 C 1100 814 1220 796 1370 772';
      const kp = 'keyPoints="0;1;1" keyTimes="0;.62;1" calcMode="spline" keySplines=".3 0 .5 1;0 0 1 1"';
      const play = `
        <path id="kDribble" class="k" pathLength="1" style="stroke-width:2;stroke-dasharray:1;stroke-dashoffset:1" d="${path}">
          <animate attributeName="stroke-dashoffset" values="1;0;0" ${kp} ${loop(7)}/>
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.04;.85;1" ${loop(7)}/>
        </path>
        <g opacity="0">
          <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.04;.85;1" ${loop(7)}/>
          <animateMotion ${kp} ${loop(7)}><mpath href="#kDribble"/></animateMotion>
          <g><animateTransform attributeName="transform" type="rotate" values="0;900;900" keyTimes="0;.62;1" ${loop(7)}/>${ball(17)}</g>
        </g>`;
      return `<g>${pitch}</g><g data-fit="1470" data-at="720,800">${cones}${goal}${play}</g>`;
    },

    // lane rope bobs along the top, the water lines drift, bubbles keep rising from the bottom
    swimming() {
      const rope = `<g class="fade" data-at="720,150" style="--del:.2s">${draw('M0 150 H1440', 1)}${Array.from({ length: 31 }, (_, i) =>
        `<ellipse class="k" cx="${i * 48 + 12}" cy="150" rx="9" ry="6"><animate attributeName="cy" values="150;144;150" dur="${2.4 + (i % 3) * .3}s" begin="${(i * .13).toFixed(2)}s" repeatCount="indefinite"/></ellipse>`).join('')}</g>`;
      const waves = [[690, 12, 11], [760, 14, 8], [830, 10, 14]].map(([y, a, s], i) =>
        `<g class="fade" data-at="720,${y}" style="--del:${(.4 + i * .25).toFixed(2)}s"><g class="drift" style="--dur:${s}s"><path class="k" d="${wave(y, a)}"/></g></g>`).join('');
      t = 1.2;
      const bubbles = Array.from({ length: 14 }, (_, i) => {
        const x = [70, 140, 230, 320, 410, 520, 600, 660, 1020, 1100, 1180, 1260, 1330, 1400][i], r = 5 + (i * 7) % 9;
        const dur = 5 + (i * 3) % 4, beg = (i * .7).toFixed(1);
        return `<circle class="k" style="stroke-width:2" cx="${x}" cy="940" r="${r}" opacity="0">
          <animate attributeName="cy" values="900;600" dur="${dur}s" begin="${beg}s" repeatCount="indefinite"/>
          <animate attributeName="cx" values="${x};${x + 10};${x - 8};${x}" dur="${dur}s" begin="${beg}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;.9;.9;0" keyTimes="0;.1;.8;1" dur="${dur}s" begin="${beg}s" repeatCount="indefinite"/>
        </circle>`;
      }).join('');
      return rope + waves + bubbles;
    },

    // court draws in; a little side-on rally keeps going over a net along the bottom
    tennis() {
      const court = draw('M380 900 L560 540 H880 L1060 900 Z', 1.2) + draw('M460 740 H980', .5) + draw('M620 540 L560 900 M820 540 L880 900', .6) +
        `<path class="k fade" style="--del:${(t += .2).toFixed(2)}s;stroke-width:5;stroke-dasharray:6 14" d="M410 640 H1030"/>`;
      const net = draw('M 40 840 H 720', .6) + draw('M 380 840 V 766 M 372 766 H 388', .3)  +
        `<path class="k fade" style="--del:${t.toFixed(2)}s;stroke-width:1.2" d="M 376 780 H 384 M 376 794 H 384 M 376 808 H 384 M 376 822 H 384"/>`;
      t += .3;
      const rally = `
        <path id="kRally" d="M 90 780 Q 300 560 560 822 Q 620 750 690 764" fill="none"/>
        <path class="k" pathLength="1" style="stroke-width:1.6;stroke-dasharray:.012 .03;opacity:.55" d="M 90 780 Q 300 560 560 822 Q 620 750 690 764">
          <animate attributeName="opacity" values="0;.55" dur=".6s" begin="${t.toFixed(2)}s" fill="freeze"/>
        </path>
        <g opacity="0">
          <set attributeName="opacity" to="1" begin="${t.toFixed(2)}s" fill="freeze"/>
          <animateMotion keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="spline" keySplines=".3 .1 .6 1;.3 .1 .6 1" ${loop(3.4)}><mpath href="#kRally"/></animateMotion>
          <g><animateTransform attributeName="transform" type="rotate" values="0;540;0" keyTimes="0;.5;1" ${loop(3.4)}/>
            <circle class="k" r="14"/><path class="k" style="stroke-width:2" d="M-9 -10 Q-3 0 -9 10 M9 -10 Q3 0 9 10"/></g>
        </g>`;
      return `<g>${court}</g><g data-at="380,790">${net}${rally}</g>`;
    },

    // bunting draws across the top and its flags drop in; handwritten Spanish words keep writing themselves
    spanish() {
      let s = '<g data-at="720,130">' + draw('M-20 90 Q 720 240 1460 70', 1.3);
      [140, 340, 540, 740, 940, 1140].forEach((x, i) => {
        const y = [118, 150, 168, 172, 160, 132][i];
        s += `<path class="kf cf" style="--del:${(t + i * .1).toFixed(2)}s" d="M${x} ${y} l20 44 l20 -41 Z"/>`;
      });
      s += '</g>';
      // spread over the whole hero; the few that sit near the copy are written fainter
      const words = [
        ['¡Hola!', 70, 800, 74], ['buenos días', 450, 272, 40], ['gracias', 980, 845, 56], ['por favor', 40, 250, 34],
        ['¡vamos!', 400, 845, 58], ['sí', 1384, 250, 46], ['¿qué tal?', 560, 712, 42], ['hablar', 630, 430, 38, 1],
        ['amigos', 1220, 850, 50], ['me llamo…', 60, 705, 34], ['adiós', 1080, 800, 40], ['fútbol', 600, 575, 40, 1],
        ['¡olé!', 330, 740, 52], ['mañana', 720, 880, 36]];
      s += words.map(([w, x, y, sz, faint], i) => `<text class="word${faint ? ' faint' : ''}" x="${x}" y="${y}" font-size="${sz}" style="--cyc:16s;--del:${(1.4 + i * 1.15).toFixed(2)}s">${w}</text>`).join('');
      return s;
    },

    // bunting draws in, then chalk balloons keep floating up and confetti flutters down
    parties() {
      let s = '<g data-at="720,120">' + draw('M-20 80 Q 720 220 1460 60', 1.3);
      for (let i = 1; i < 12; i++) {
        const u = i / 12, x = (1 - u) ** 2 * -20 + 2 * (1 - u) * u * 720 + u * u * 1460, y = (1 - u) ** 2 * 80 + 2 * (1 - u) * u * 220 + u * u * 60;
        s += `<path class="k cf" style="--del:${(t + i * .07).toFixed(2)}s;stroke-width:2.4" d="M${(x - 16).toFixed(0)} ${y.toFixed(0)} L${x.toFixed(0)} ${(y + 34).toFixed(0)} L${(x + 16).toFixed(0)} ${y.toFixed(0)}"/>`;
      }
      s += '</g>';
      const xs = [120, 420, 640, 1000, 1220, 1390];
      s += xs.map((x, i) => {
        const dur = 10 + (i * 5) % 5, beg = (1 + i * 1.6).toFixed(1), sc = .8 + (i % 3) * .15;
        const left = x < 760, top = left ? 600 : -140, d2 = left ? dur * .45 : dur;
        return `<g opacity="0" data-at="${x},900">
          <animate attributeName="opacity" values="${left ? '0;1;1;0' : '0;1;1'}" keyTimes="${left ? '0;.1;.6;1' : '0;.05;1'}" dur="${d2}s" begin="${beg}s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="translate" values="${x} 960; ${x} ${top}" dur="${d2}s" begin="${beg}s" repeatCount="indefinite"/>
          <g><animateTransform attributeName="transform" type="rotate" values="-6;6;-6" dur="3s" repeatCount="indefinite"/>
            <g transform="scale(${sc})"><ellipse class="k" rx="26" ry="33"/><path class="k" style="stroke-width:2" d="M-4 33 h8 l-4 6 Z M0 39 q-9 22 4 44 t-3 40"/>
            <path class="k" style="stroke-width:2" d="M-14 -18 q4 -8 12 -10"/></g></g></g>`;
      }).join('');
      s += Array.from({ length: 18 }, (_, i) => {
        const x = (i * 83) % 1440, dur = 7 + (i * 3) % 5, beg = (1.5 + i * .45).toFixed(2);
        return `<g opacity="0" data-pin="none"><set attributeName="opacity" to="1" begin="${beg}s"/>
          <animateTransform attributeName="transform" type="translate" values="${x} -30; ${x + 40} 940" dur="${dur}s" begin="${beg}s" repeatCount="indefinite"/>
          <path class="k" style="stroke-width:2.6" d="M-5 -4 L5 4"><animateTransform attributeName="transform" type="rotate" values="0;360" dur="${1.5 + (i % 4) * .4}s" repeatCount="indefinite"/></path></g>`;
      }).join('');
      return s;
    },

    // medals swing on their ribbons from the top; whistles along the bottom give little toots
    coaches() {
      const medal = (x, len, sw) => `<g data-at="${x},0"><g transform="translate(${x} 0)"><g>
          <animateTransform attributeName="transform" type="rotate" values="${-sw} 0 0;${sw} 0 0;${-sw} 0 0" dur="${3 + (x % 7) / 7}s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1"/>
          ${draw(`M-18 -10 L-6 ${len} M18 -10 L6 ${len} M-18 -10 H-6 L0 ${len - 30} L6 -10 H18`, .8)}
          ${draw(`M0 ${len + 30} m-30 0 a30 30 0 1 0 60 0 a30 30 0 1 0 -60 0`, .6)}
          ${draw(`M0 ${len + 30} m-21 0 a21 21 0 1 0 42 0 a21 21 0 1 0 -42 0`, .4, 'style="stroke-width:2"')}
          <path class="kf cf" style="--del:${t.toFixed(2)}s" d="M0 ${len + 16} l4.5 9 l10 1.4 l-7.2 7 l1.7 10 l-9 -4.7 l-9 4.7 l1.7 -10 l-7.2 -7 l10 -1.4 Z"/>
        </g></g></g>`;
      const whistle = (x, y, flip, beg) => `<g transform="translate(${x} ${y}) scale(${flip} 1)">
          ${draw('M-24 0 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0', .5)}
          ${draw('M0 -24 H58 V-3 H21', .5)}
          ${draw('M-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M30 -24 v-7 h12 v7', .4, 'style="stroke-width:2"')}
          ${draw('M-20 14 q-30 34 6 60', .4, 'style="stroke-width:2"')}
          <path class="k" style="stroke-width:2.6" d="M68 -30 l14 -9 M71 -14 h17 M68 2 l14 9" opacity="0">
            <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;.06;.3;.4;1" dur="2.8s" begin="${beg}s" repeatCount="indefinite"/>
          </path></g>`;
      t = .2;
      let s = medal(420, 130, 5) + medal(680, 200, 6) + medal(1410, 260, 4);
      s += whistle(120, 760, 1, 2.2) + whistle(560, 790, -1, 3.1) + whistle(1030, 790, 1, 3.8);
      return s;
    },

    // a chalk thank-you: big handwritten "thank you" under the copy, "¡gracias!" up top, hearts that draw in and beat
    supporters() {
      const heart = (x, y, sc, beg) => `<g transform="translate(${x} ${y}) scale(${sc})"><g>
          <animateTransform attributeName="transform" type="scale" values="1;1.12;1;1.08;1" keyTimes="0;.1;.2;.3;1" dur="2.6s" begin="${beg}s" repeatCount="indefinite"/>
          ${draw('M0 14 C-34 -10 -22 -38 0 -22 C22 -38 34 -10 0 14 Z', .6)}</g></g>`;
      let s = `<g><text class="word once" x="70" y="820" font-size="96" style="--del:.6s;--dur:1.6s">thank you</text>`;
      s += `<text class="word once" x="560" y="268" font-size="52" style="--del:1.8s;--dur:1s">¡gracias!</text>`;
      s += `<text class="word once" x="1000" y="850" font-size="54" style="--del:2.6s;--dur:1s">ありがとう</text>`;
      t = 2;
      s += heart(470, 760, 1.1, 2.4) + heart(340, 205, .8, 3) + heart(1405, 230, .9, 3.4) + heart(1300, 830, .7, 3.8);
      s = s.replace('</text>', '</text>' + draw('M80 840 q200 26 400 -4', .7, 'style="stroke-width:2.6"') + '</g>');
      return s;
    },

    // questions answered: chalk question marks drift about, speech bubbles ask and answer, a lightbulb switches on
    faq() {
      const bubble = (x, y, w, mark, flip) => '<g>' + draw(`M${x} ${y} h${w} q16 0 16 16 v36 q0 16 -16 16 h${flip ? -(w - 34) : -18} l${flip ? -10 : -14} 18 l${flip ? -4 : 2} -18 h${flip ? -20 : -(w - 38)} q-16 0 -16 -16 v-36 q0 -16 16 -16 Z`, .7) +
        `<text class="word once" x="${x + w / 2 - 8}" y="${y + 50}" font-size="52" style="--del:${t.toFixed(2)}s;--dur:.4s">${mark}</text></g>`;
      t = .4;
      let s = bubble(80, 720, 110, '?', 0); t += .4;
      s += bubble(260, 770, 110, '!', 1); t += .3;
      // lightbulb with rays that flicker on
      s += `<g transform="translate(560 250)">${draw('M-22 0 a26 26 0 1 1 44 0 q-8 10 -8 22 h-28 q0 -12 -8 -22 Z M-12 30 h24 M-10 38 h20', .9)}
          <path class="k" style="stroke-width:2.6" opacity="0" d="M0 -44 v-14 M-34 -30 l-10 -10 M34 -30 l10 -10 M-44 0 h-14 M44 0 h14">
            <animate attributeName="opacity" values="0;1;.3;1;1;0" keyTimes="0;.08;.12;.18;.85;1" dur="4s" begin="${(t + .6).toFixed(2)}s" repeatCount="indefinite"/></path></g>`;
      t += .6;
      const marks = [[960, 850, 70], [1150, 820, 48], [1395, 250, 60], [700, 860, 44], [430, 860, 40]];
      s += marks.map(([x, y, sz], i) => `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -10;0 0" dur="${3 + i * .4}s" repeatCount="indefinite"/>
          <text class="word once" x="${x}" y="${y}" font-size="${sz}" style="--del:${(t + i * .25).toFixed(2)}s;--dur:.4s">?</text></g>`).join('');
      return s;
    },
  };
  if (!scenes[page]) return;

  if (['spanish', 'supporters', 'faq'].includes(page) && !document.querySelector('link[href*="Caveat"]')) {
    const l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap'; document.head.append(l);
  }
  svg.setAttribute('preserveAspectRatio', 'xMidYMax slice');
  svg.removeAttribute('stroke'); svg.removeAttribute('stroke-opacity'); svg.removeAttribute('stroke-width'); svg.setAttribute('fill', 'none');
  // phones: start everything sooner, people scroll on quickly (the repeating word cycles keep their rhythm)
  const quick = innerWidth <= 700 ? .5 : 1;
  const sped = (h) => quick === 1 ? h : h
    .replace(/style="[^"]*"/g, (a) => a.includes('--cyc') ? a : a.replace(/--del:([\d.]+)s/, (_, n) => `--del:${(n * quick).toFixed(2)}s`))
    .replace(/begin="([\d.]+)s"/g, (_, n) => `begin="${(n * quick).toFixed(2)}s"`);
  svg.innerHTML = `<filter id="kChalk" filterUnits="userSpaceOnUse" x="-40" y="-40" width="1520" height="1000">
      <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="4" result="w"/>
      <feDisplacementMap in="SourceGraphic" in2="w" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="l"/>
      <feTurbulence type="fractalNoise" baseFrequency="1.4" seed="11" result="g"/>
      <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2 1.7" result="a"/>
      <feComposite in="l" in2="a" operator="in"/>
    </filter><g filter="url(#kChalk)">${sped(scenes[page]())}</g>`;
  svg.parentElement.classList.add('chalked');

  // fit the board to the hero's shape. Each piece keeps its size, but its position is mapped in proportion
  // onto whatever part of the board is showing: top pieces stay at the top on wide screens, side pieces stay
  // on screen on phones. Pieces that move together are wrapped in one <g> (data-at overrides the centre,
  // data-fit shrinks a wide group to fit, data-pin="none" leaves it alone).
  const root = svg.querySelector('g[filter]'), filt = svg.querySelector('#kChalk');
  const pins = [...root.children].filter(el => el.dataset.pin !== 'none').map(el => {
    const w = document.createElementNS('http://www.w3.org/2000/svg', 'g'); el.before(w); w.append(el);
    const b = w.getBBox(), at = el.dataset.at ? el.dataset.at.split(',').map(Number) : [b.x + b.width / 2, b.y + b.height / 2];
    return { w, at, half: el.dataset.at ? 0 : b.width / 2, fit: +el.dataset.fit || 0, full: b.width > 1000 };
  });
  let cover = 0;
  const layout = () => {
    const W = svg.clientWidth, H = svg.clientHeight; if (!W || !H) return;
    // on phones the light sheet covers more of the hero's foot, so the board's bottom edge sits at the sheet's top
    const sheet = document.querySelector('.sheet');
    if (innerWidth <= 700 && sheet && scrollY === 0) cover = Math.max(0, svg.getBoundingClientRect().bottom - sheet.getBoundingClientRect().top - 10);
    const lift = innerWidth <= 700 ? cover : 0;
    const s = Math.min(Math.max(W / 1440, (H - lift) / 900), W / 820), vw = W / s, vh = H / s, x0 = (1440 - vw) / 2, y0 = 900 + lift / s - vh;
    svg.setAttribute('viewBox', `${x0} ${y0} ${vw} ${vh}`);
    Object.entries({ x: x0 - 40, y: y0 - 40, width: vw + 80, height: vh + 80 }).forEach(([k, v]) => filt.setAttribute(k, v));
    // top band keeps its distance from the top, bottom band from the bottom, the middle stretches between
    const k = Math.min(1, (vh - lift / s) / 900), fy = (y) => y < 300 ? y0 + y * k : y > 600 ? 900 - (900 - y) * k : y0 + 300 * k + (y - 300) / 300 * (vh - lift / s - 600 * k);
    for (const p of pins) {
      const [cx, cy] = p.at, sc = p.fit ? Math.min(1, Math.max(.6, vw * .96 / p.fit)) : 1, half = p.half * sc;
      let nx = x0 + cx * vw / 1440;
      if (half && half * 2 < vw - 40) nx = Math.min(Math.max(nx, x0 + half + 20), x0 + vw - half - 20);
      p.w.setAttribute('transform', `translate(${nx.toFixed(1)} ${fy(cy).toFixed(1)}) scale(${sc.toFixed(3)}) translate(${-cx} ${-cy})`);
    }
    // phones stack the copy and photo, so a piece that lands on them is left out rather than drawn over the words
    const solid = innerWidth <= 700 ? [...document.querySelectorAll('.world-copy > *, .world-photo img')].map(e => e.getBoundingClientRect()) : [];
    for (const p of pins) {
      p.w.style.display = '';
      if (!solid.length || p.fit || p.full) continue;
      const r = p.w.getBoundingClientRect(), hit = solid.filter(o => r.left < o.right && r.right > o.left && r.top < o.bottom && r.bottom > o.top);
      if (!hit.length) continue;
      // bottom pieces slide down under the photo when there is room above the sheet; anything else is left out
      const down = Math.max(...hit.map(o => o.bottom)) + 8 - r.top, floor = svg.getBoundingClientRect().bottom - lift;
      const f = Math.min(1, (floor - r.top - down) / r.height), sr = svg.getBoundingClientRect();
      if (p.at[1] > 600 && f >= .6) {   // shrink it a little from its top edge if the gap is tight
        const ux = x0 + (r.left + r.width / 2 - sr.left) / s, uy = y0 + (r.top - sr.top) / s;
        p.w.setAttribute('transform', `translate(0 ${(down / s).toFixed(1)}) translate(${ux.toFixed(1)} ${uy.toFixed(1)}) scale(${f.toFixed(3)}) translate(${(-ux).toFixed(1)} ${(-uy).toFixed(1)}) ` + p.w.getAttribute('transform'));
      } else p.w.style.display = 'none';
    }
  };
  layout();
  new ResizeObserver(layout).observe(svg);
  if (reduce) svg.pauseAnimations();
})();
