/* Language picker (EN / 日本語 / Español). English lives in the HTML; T maps each block's
   English HTML to [Japanese, Spanish]. Anything missing from T just stays in English. */
(function () {
  var T = window.TMS_T || {};
  var LANGS = [
    { id: 'en', name: 'English', flag: '<svg viewBox="0 0 60 40"><clipPath id="lgUk"><path d="M0 0h60v40H0z"/></clipPath><g clip-path="url(#lgUk)"><path d="M0 0h60v40H0z" fill="#012169"/><path d="M0 0l60 40M60 0L0 40" stroke="#fff" stroke-width="8"/><path d="M0 0l60 40M60 0L0 40" stroke="#C8102E" stroke-width="3"/><path d="M30 0v40M0 20h60" stroke="#fff" stroke-width="12"/><path d="M30 0v40M0 20h60" stroke="#C8102E" stroke-width="7"/></g></svg>' },
    { id: 'ja', name: '日本語', flag: '<svg viewBox="0 0 60 40"><path d="M0 0h60v40H0z" fill="#fff"/><circle cx="30" cy="20" r="11" fill="#BC002D"/></svg>' },
    { id: 'es', name: 'Español', flag: '<svg viewBox="0 0 60 40"><path d="M0 0h60v40H0z" fill="#AA151B"/><path d="M0 10h60v20H0z" fill="#F1BF00"/></svg>' }
  ];
  var SKIP = 'script,style,svg,noscript,template,.langpick';
  var CONTROLS = 'input,select,textarea';
  var norm = function (s) { return s.replace(/\s+/g, ' ').trim(); };
  var units = [];   // [node, 'html' | 'text' | attribute name, english]

  function visit(el) {
    if (el.matches(SKIP)) return;
    var hasText = false;
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3 && n.nodeValue.trim()) { hasText = true; break; }
    }
    if (hasText && !el.querySelector(CONTROLS)) { units.push([el, 'html', norm(el.innerHTML)]); return; }
    if (hasText) {   // a label wrapping its input: swap only the words, keep the control (and what's typed in it)
      el.childNodes.forEach(function (n) { if (n.nodeType === 3 && n.nodeValue.trim()) units.push([n, 'text', norm(n.nodeValue)]); });
    }
    for (var j = 0; j < el.children.length; j++) visit(el.children[j]);
  }

  function collect() {
    visit(document.body);
    document.querySelectorAll('[placeholder],[aria-label]').forEach(function (el) {
      ['placeholder', 'aria-label'].forEach(function (a) { var v = el.getAttribute(a); if (v) units.push([el, a, norm(v)]); });
    });
  }

  function tr(en, lang) {
    if (lang === 'en') return en;
    var t = T[en];
    return t ? t[lang === 'ja' ? 0 : 1] : en;
  }

  function apply(lang) {
    units.forEach(function (u) {
      var out = tr(u[2], lang);
      if (u[1] === 'html') { if (norm(u[0].innerHTML) !== norm(out)) u[0].innerHTML = out; }
      else if (u[1] === 'text') u[0].nodeValue = ' ' + out + ' ';
      else u[0].setAttribute(u[1], out);
    });
    document.documentElement.lang = lang;
    var cur = LANGS.filter(function (l) { return l.id === lang; })[0];
    var btn = document.querySelector('.langpick > button');
    if (btn) btn.innerHTML = '<span class="flag">' + cur.flag + '</span><span class="code">' + lang.toUpperCase() + '</span>';
    document.querySelectorAll('.langpick li button').forEach(function (b) { b.setAttribute('aria-current', b.dataset.lang === lang ? 'true' : 'false'); });
  }

  function picker() {
    var header = document.querySelector('body > header');
    if (!header) return;
    var box = header.querySelector('.langpick');   // written into each page's header so it's there from the first frame
    if (!box) {
      box = document.createElement('div');
      box.className = 'langpick';
      box.innerHTML = '<button type="button" aria-haspopup="true" aria-expanded="false" aria-label="Language"></button><ul>' +
        LANGS.map(function (l) { return '<li><button type="button" data-lang="' + l.id + '"><span class="flag">' + l.flag + '</span>' + l.name + '</button></li>'; }).join('') + '</ul>';
      header.insertBefore(box, header.querySelector('.navtoggle'));
    }
    var top = box.firstChild;
    var close = function () { box.classList.remove('open'); top.setAttribute('aria-expanded', 'false'); };
    top.addEventListener('click', function (e) { e.stopPropagation(); var o = box.classList.toggle('open'); top.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    box.querySelectorAll('li button').forEach(function (b) {
      b.addEventListener('click', function () { try { localStorage.setItem('lang', b.dataset.lang); } catch (e) {} apply(b.dataset.lang); close(); });
    });
    document.addEventListener('click', function (e) { if (!box.contains(e.target)) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  var lang = 'en';
  try { lang = localStorage.getItem('lang') || 'en'; } catch (e) {}
  collect();
  picker();
  apply(lang);
  document.documentElement.classList.remove('lang-wait');

  // the mobile menu button flips between Menu / Close in transitions.js
  var toggle = document.querySelector('.navtoggle');
  if (toggle) new MutationObserver(function () {
    var l = document.documentElement.lang, en = norm(toggle.textContent);
    if (l !== 'en' && T[en]) toggle.textContent = tr(en, l);
    var a = toggle.getAttribute('aria-label');
    if (l !== 'en' && T[a]) toggle.setAttribute('aria-label', tr(a, l));
  }).observe(toggle, { childList: true, attributes: true, attributeFilter: ['aria-label'] });
})();
