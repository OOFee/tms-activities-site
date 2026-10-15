// Weak-device check, run first thing on every page. On devices that can't keep up, the chalk drawings show
// finished and still, and the click toys / hero physics stay off (html.lite + window.TMS_LITE).
// Signals: Data Saver on, 2 or fewer CPU cores, 2GB or less memory, or two pages in a row that measured slow.
// ?fx=off forces lite mode, ?fx=on clears it (handy for testing).
(function () {
  var d = document.documentElement, n = navigator, ls = null, stored = false, DAY = 864e5;
  try { ls = window.localStorage; } catch (e) {}
  try {
    if (/[?&]fx=on\b/.test(location.search)) { ls.removeItem('tmsLite'); ls.removeItem('tmsSlow'); }
    if (/[?&]fx=off\b/.test(location.search)) ls.setItem('tmsLite', String(Date.now() + 365 * DAY));
    stored = Date.now() < +(ls.getItem('tmsLite') || 0);   // a slow verdict lasts a few days, then it gets re-checked
  } catch (e) {}
  var lite = stored || (n.connection && n.connection.saveData === true) ||
    (n.deviceMemory && n.deviceMemory <= 2) || (n.hardwareConcurrency && n.hardwareConcurrency <= 2);
  window.TMS_LITE = !!lite;
  if (lite) { d.classList.add('lite'); return; }

  // otherwise time two seconds of animation, starting a second after load (past the image decoding). It takes
  // two slow pages in a row to switch to lite, so one janky moment doesn't stick
  var t0 = 0, frames = 0, gaveUp = false;
  var stop = function () { gaveUp = true; };
  function tick(t) {
    if (gaveUp) return;
    if (!t0) t0 = t; else frames++;
    if (t - t0 < 2000) return requestAnimationFrame(tick);
    removeEventListener('visibilitychange', stop);
    try {
      if (frames / ((t - t0) / 1000) >= 24) return ls.removeItem('tmsSlow');
      var strikes = +(ls.getItem('tmsSlow') || 0) + 1;
      if (strikes >= 2) { ls.setItem('tmsLite', String(Date.now() + 3 * DAY)); ls.removeItem('tmsSlow'); }
      else ls.setItem('tmsSlow', String(strikes));
    } catch (e) {}
  }
  addEventListener('visibilitychange', stop);   // a hidden tab stops animating, which says nothing about the device
  addEventListener('load', function () { setTimeout(function () { if (!document.hidden && !gaveUp) requestAnimationFrame(tick); }, 1000); });
})();
