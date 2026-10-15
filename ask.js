/* Quick question: a pinned "?" button above WhatsApp/Instagram that opens a tiny email + message box.
   Runs before lang.js so the words get translated with the rest of the page. */
(function () {
  var pin = document.querySelector('.socialpin');
  if (!pin) return;
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ask';
  btn.setAttribute('aria-label', 'Ask a quick question');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z"/><path d="M10 8.2a2 2 0 1 1 2.6 1.9c-.4.1-.6.5-.6.9v.5"/><circle cx="12" cy="13.2" r=".4" fill="currentColor"/></svg>';
  pin.insertBefore(btn, pin.firstChild);

  var box = document.createElement('form');
  box.className = 'askbox';
  box.hidden = true;
  box.noValidate = true;
  box.innerHTML =
    '<button type="button" class="x" aria-label="Close">×</button>' +
    '<h3>Quick question?</h3>' +
    '<p class="sub">Leave your email and we’ll get back to you.</p>' +
    '<input type="email" name="email" placeholder="Your email" aria-label="Your email" autocomplete="email" required>' +
    '<textarea name="message" rows="4" placeholder="Your question" aria-label="Your question" required></textarea>' +
    '<p class="err" hidden>Please add a valid email and your question.</p>' +
    '<button type="submit" class="send">Send</button>' +
    '<div class="done" hidden><h3>Thanks!</h3><p>We’ll reply by email soon. (This is a demo, so nothing was sent yet.)</p></div>';
  document.body.appendChild(box);

  var email = box.querySelector('input'), msg = box.querySelector('textarea'), err = box.querySelector('.err');
  function open(o) {
    box.hidden = !o;
    btn.setAttribute('aria-expanded', o ? 'true' : 'false');
    if (o) setTimeout(function () { (box.querySelector('.done').hidden ? email : box.querySelector('.x')).focus(); }, 30);
  }
  btn.addEventListener('click', function (e) { e.stopPropagation(); open(box.hidden); });
  box.querySelector('.x').addEventListener('click', function () { open(false); btn.focus(); });
  document.addEventListener('click', function (e) {
    if (e.target.closest('a[href="#suggest"]')) { e.preventDefault(); open(true); return; }   // "Suggest a sport" on the home page
    if (!box.hidden && !box.contains(e.target)) open(false);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !box.hidden) { open(false); btn.focus(); } });
  box.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) && msg.value.trim();
    err.hidden = !!ok;
    if (!ok) return;
    box.querySelectorAll('.sub, input, textarea, .send').forEach(function (n) { n.hidden = true; });
    box.querySelector('.done').hidden = false;
  });
})();
