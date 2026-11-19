/* MTMover analytics: Google Analytics 4 with consent (Consent Mode v2). Runs only on mtmover.tech. */
(function () {
  'use strict';
  var ID = 'G-HBDXDDLW9B', KEY = 'mtm_consent', HOSTS = ['mtmover.tech', 'www.mtmover.tech'];
  if (window.MTMConsent) return;
  if (HOSTS.indexOf(location.hostname) < 0) return; /* no tracking on localhost / previews */
  function get() { try { var v = localStorage.getItem(KEY); return v === 'granted' || v === 'denied' ? v : null; } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  var saved = get();
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: saved === 'granted' ? 'granted' : 'denied', wait_for_update: 500 });
  gtag('js', new Date());
  gtag('config', ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
  var s = el('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID; document.head.appendChild(s);

  var CSS = '.mtma-bar{position:fixed;left:16px;right:16px;bottom:16px;max-width:760px;margin:0 auto;z-index:9990;background:#0b0f14;color:#fff;border-radius:14px;padding:16px 18px;display:flex;gap:14px;align-items:center;flex-wrap:wrap;box-shadow:0 10px 30px rgba(11,15,20,.35);font:14.5px/1.5 "Segoe UI",system-ui,Arial,sans-serif}' +
    '.mtma-bar p{margin:0;flex:1;min-width:240px}.mtma-bar a{color:#9cc9ff;text-decoration:underline}' +
    '.mtma-btn{border:1.5px solid #fff;border-radius:999px;padding:9px 20px;font:600 14.5px "Segoe UI",system-ui,sans-serif;cursor:pointer}' +
    '.mtma-yes{background:#0a66c2;border-color:#0a66c2;color:#fff}.mtma-yes:hover{background:#0a4f99;border-color:#0a4f99}' +
    '.mtma-no{background:transparent;color:#fff}.mtma-no:hover{background:rgba(255,255,255,.14)}';
  var bar = null;
  function style() { if (document.getElementById('mtma-style')) return; var st = el('style'); st.id = 'mtma-style'; st.textContent = CSS; document.head.appendChild(st); }
  function close() { if (bar && bar.parentNode) bar.parentNode.removeChild(bar); bar = null; }
  function choose(v) {
    var was = get(); set(v);
    gtag('consent', 'update', { analytics_storage: v === 'granted' ? 'granted' : 'denied' });
    /* the page_view fired at load went out while consent was denied and is not counted: send it again once consent is granted */
    if (v === 'granted' && was !== 'granted') gtag('event', 'page_view', { page_location: location.href, page_title: document.title });
    close();
  }
  function open() {
    if (bar) return; style();
    bar = el('div', 'mtma-bar'); bar.setAttribute('role', 'dialog'); bar.setAttribute('aria-label', 'Cookie consent');
    var p = el('p', '', 'We use Google Analytics to count visits and see which pages help. It sets cookies only if you accept. '); var a = el('a', '', 'Privacy Policy'); a.href = '/privacy.html'; p.appendChild(a);
    var no = el('button', 'mtma-btn mtma-no', 'Decline'); no.type = 'button'; no.onclick = function () { choose('denied'); };
    var yes = el('button', 'mtma-btn mtma-yes', 'Accept'); yes.type = 'button'; yes.onclick = function () { choose('granted'); };
    bar.appendChild(p); bar.appendChild(no); bar.appendChild(yes); document.body.appendChild(bar);
  }
  if (!saved) open();
  /* footer link to change the choice later */
  var fl = document.querySelector('footer a[href="/privacy.html"]');
  if (fl && fl.parentNode) {
    var cs = el('a', fl.className, 'Cookie settings'); cs.href = '#'; cs.onclick = function (ev) { ev.preventDefault(); open(); };
    fl.parentNode.insertBefore(cs, fl.nextSibling);
  }
  /* events: add to cart, order by email, installer download */
  var C = window.MTMCart;
  if (C && C.add && !C.__ga) {
    var orig = C.add; C.__ga = true;
    C.add = function (id, qty) { try { gtag('event', 'add_to_cart', { items: [{ item_id: String(id), quantity: parseInt(qty, 10) || 1 }] }); } catch (e) {} return orig.apply(C, arguments); };
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null; if (!a || !a.href) return;
    if (/\.msi(\?|#|$)/i.test(a.href)) gtag('event', 'file_download', { file_extension: 'msi', link_url: a.href });
    else if (/^mailto:contact@mtmover\.tech\?subject=MTMover%20order/i.test(a.href)) gtag('event', 'generate_lead', { method: 'order_email' });
  });
  window.MTMConsent = { open: open, get: get };
})();