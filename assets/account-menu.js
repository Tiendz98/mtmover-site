/* MTMover account menu: round account button at the right end of the header (every page). Signed out: opens the sign-in page. Signed in: a menu. */
(function () {
  'use strict';
  if (window.MTMAccount) return;
  var TOKEN = 'mtm_web_token', EMAILK = 'mtm_acct_email', API = 'https://mtmover-license.mtmover.workers.dev';
  var wrap, btn, menu, pill = null, tok = '', email = '', isOpen = false;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function getTok() { try { return localStorage.getItem(TOKEN) || ''; } catch (e) { return ''; } }
  function clearTok() { try { localStorage.removeItem(TOKEN); sessionStorage.removeItem(EMAILK); } catch (e) {} }
  function cachedEmail() { try { return sessionStorage.getItem(EMAILK) || ''; } catch (e) { return ''; } }
  function cacheEmail(v) { try { sessionStorage.setItem(EMAILK, v); } catch (e) {} }
  var CSS = [
    '.mtmu-wrap{position:relative;display:inline-block;margin-left:14px;vertical-align:middle;flex:0 0 auto}',
    '.mtmu-btn{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;box-sizing:border-box;border-radius:999px;border:1.5px solid #cfd6df;background:#fff;color:var(--ink,#111827);cursor:pointer;padding:0;font:700 16px/1 "Segoe UI",system-ui,sans-serif}',
    '.mtmu-btn:hover{border-color:var(--acc,#0a66c2);color:var(--acc,#0a66c2)}',
    '.mtmu-btn.in{background:var(--black,#0b0f14);border-color:var(--black,#0b0f14);color:#fff}',
    '.mtmu-btn.in:hover{background:var(--acc,#0a66c2);border-color:var(--acc,#0a66c2);color:#fff}',
    '.mtmu-btn svg{width:21px;height:21px}',
    '.mtmu-menu{position:absolute;right:0;top:calc(100% + 8px);width:260px;background:#fff;border:1px solid var(--line,#e5e7eb);border-radius:14px;box-shadow:0 14px 34px rgba(11,15,20,.18);z-index:9990;padding:8px;font:15px/1.4 "Segoe UI",system-ui,sans-serif;color:var(--ink,#111827)}',
    '.mtmu-hide{display:none!important}',
    '.mtmu-head{padding:10px 12px 12px;border-bottom:1px solid var(--line,#e5e7eb);margin-bottom:6px}',
    '.mtmu-head small{display:block;color:var(--mut,#5b6472);font-size:12.5px}.mtmu-head b{display:block;word-break:break-all;font-size:14.5px}',
    '.mtmu-item{display:block;width:100%;box-sizing:border-box;text-align:left;padding:9px 12px;border:0;border-radius:9px;background:none;color:var(--ink,#111827);font:inherit;cursor:pointer;text-decoration:none}',
    '.mtmu-item:hover{background:var(--soft,#f6f8fb);text-decoration:none;color:var(--ink,#111827)}',
    '.mtmu-sep{height:1px;background:var(--line,#e5e7eb);margin:6px 0}',
    '.mtmu-out{color:#b91c1c}.mtmu-out:hover{color:#b91c1c}'
  ].join('\n');
  function svgUser() {
    var NS = 'http://www.w3.org/2000/svg', s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', '21'); s.setAttribute('height', '21'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true');
    var c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', '12'); c.setAttribute('cy', '8'); c.setAttribute('r', '4'); s.appendChild(c);
    var p = document.createElementNS(NS, 'path'); p.setAttribute('d', 'M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7'); s.appendChild(p);
    return s;
  }
  function closeMenu() { isOpen = false; if (menu) menu.classList.add('mtmu-hide'); if (btn) btn.setAttribute('aria-expanded', 'false'); }
  function link(text, href) { var a = el('a', 'mtmu-item', text); a.href = href; return a; }
  function signOut() {
    var t = tok; clearTok(); tok = ''; email = ''; closeMenu(); render();
    var done = function () { if (/^\/account/.test(location.pathname)) location.reload(); };
    try { fetch(API + '/v1/web/logout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: t }) }).then(done, done); } catch (e) { done(); }
  }
  function render() {
    btn.textContent = ''; menu.textContent = '';
    if (!tok) {
      btn.className = 'mtmu-btn'; btn.setAttribute('aria-label', 'Sign in'); btn.setAttribute('title', 'Sign in'); btn.appendChild(svgUser());
      if (pill) pill.classList.remove('mtmu-hide');
      closeMenu(); return;
    }
    btn.className = 'mtmu-btn in'; btn.setAttribute('aria-label', 'Account menu'); btn.setAttribute('title', email || 'Account');
    btn.appendChild(document.createTextNode((email || 'A').charAt(0).toUpperCase()));
    if (pill) pill.classList.add('mtmu-hide');
    var head = el('div', 'mtmu-head'); head.appendChild(el('small', '', 'Signed in as')); head.appendChild(el('b', '', email || '...')); menu.appendChild(head);
    menu.appendChild(link('My licenses', '/account/'));
    menu.appendChild(link('Buy licenses', '/pricing.html'));
    menu.appendChild(link('Download MTMover', '/download.html'));
    menu.appendChild(link('Account settings', '/account/#settings'));
    menu.appendChild(link('Support', '/support.html'));
    menu.appendChild(el('div', 'mtmu-sep'));
    var out = el('button', 'mtmu-item mtmu-out', 'Sign out'); out.type = 'button'; out.onclick = signOut; menu.appendChild(out);
  }
  function validate() {
    var t = tok; if (!t) return;
    try {
      fetch(API + '/v1/web/me', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: t }) })
        .then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); })
        .then(function (x) {
          if (t !== tok) return;
          if (x.j && x.j.ok && x.j.email) { email = x.j.email; cacheEmail(email); render(); }
          else if (x.s === 401) { clearTok(); tok = ''; email = ''; render(); }
        }).catch(function () {});
    } catch (e) {}
  }
  function refresh() { tok = getTok(); email = tok ? cachedEmail() : ''; render(); validate(); }
  function mount() {
    if (!document.getElementById('mtmu-style')) { var st = el('style'); st.id = 'mtmu-style'; st.textContent = CSS; document.head.appendChild(st); }
    var a = document.querySelector('header a[href="/account/"]') || document.querySelector('header a[href^="/account"]');
    if (a && /\bpill\b/.test(a.className || '')) pill = a;
    var host = (a && a.parentNode) || document.querySelector('header .bar') || document.querySelector('header') || document.body;
    wrap = el('div', 'mtmu-wrap'); btn = el('button', 'mtmu-btn'); btn.type = 'button'; btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
    menu = el('div', 'mtmu-menu mtmu-hide'); menu.setAttribute('role', 'menu');
    btn.onclick = function (ev) {
      if (!tok) { location.href = '/account/'; return; }
      if (ev && ev.stopPropagation) ev.stopPropagation();
      isOpen = !isOpen; menu.classList.toggle('mtmu-hide', !isOpen); btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    };
    wrap.appendChild(btn); wrap.appendChild(menu); host.appendChild(wrap);
    document.addEventListener('click', function (e) { if (isOpen && wrap && !(e.target && wrap.contains && wrap.contains(e.target))) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) { closeMenu(); btn.focus && btn.focus(); } });
    window.addEventListener('storage', function (e) { if (e.key === TOKEN || e.key === null) refresh(); });
    setInterval(function () { if (getTok() !== tok) refresh(); }, 1200);   /* the account page signs in / out without reloading */
    refresh();
  }
  window.MTMAccount = { refresh: refresh };
  mount();
})();