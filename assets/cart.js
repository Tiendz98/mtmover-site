/* MTMover cart: header cart button + slide-in cart/checkout drawer. Shared by every page. */
(function () {
  'use strict';
  if (window.MTMCart) return;
  var MIN_ORDER = 10, MAXQ = 100000, KEY = 'mtm_cart', TOKEN = 'mtm_web_token', MAIL = 'contact@mtmover.tech';
  var API = 'https://mtmover-license.mtmover.workers.dev';
  var PAYMENT_ENABLED = !!(window.MTM_PADDLE && window.MTM_PADDLE.token && window.MTM_PADDLE.env); /* S17: on when assets/paddle-config.js has a Paddle token */
  var PRODUCTS = [
    { id: 't2t_email', name: 'Tenant to Tenant: Email', unit: 'mailbox', price: 2, term: 'Perpetual', desc: 'Migrate Exchange Online mailboxes between Microsoft 365 tenants. One unit per source mailbox.' },
    { id: 't2t_sites', name: 'Tenant to Tenant: OneDrive / SharePoint / Teams', unit: 'site', price: 2, term: 'Perpetual', desc: 'Migrate OneDrive accounts, SharePoint sites and Teams sites. One unit per site.' },
    { id: 't2t_teams_chat', name: 'Tenant to Tenant: Teams chat', unit: 'user', price: 2, term: 'Perpetual', desc: 'Migrate Teams chat history. One unit per source user.' },
    { id: 'imap', name: 'IMAP Migration', unit: 'mailbox', price: 2, term: 'Perpetual', desc: 'Migrate mailboxes from IMAP servers into Microsoft 365. One unit per source mailbox.' },
    { id: 'backup_email', name: 'Backup & Restore (email only)', unit: 'mailbox', price: 2, term: '1 year', desc: 'Encrypted, incremental backup and restore of Microsoft 365 mailboxes. One unit per mailbox, valid for one year.' },
    { id: 'mailbox_tools', name: 'Mailbox Tools (full option)', unit: 'year', price: 20, term: '1 year', desc: 'All Mailbox Tools features, with no per-mailbox limit. One license per year.', flat: true }
  ];
  var BY = {}; PRODUCTS.forEach(function (p) { BY[p.id] = p; });
  var cart = {}, step = 'cart', isOpen = false, email = '', agree = false;
  var fab, badge, overlay, panel, titleEl, bodyEl, mailLink = null, msgEl = null;

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function money(n) { return '$' + n.toLocaleString('en-US'); }
  function clampQty(v, flat) { if (flat) return 1; var n = parseInt(v, 10); if (!isFinite(n) || n < 1) return 1; return n > MAXQ ? MAXQ : n; }
  function load() {
    cart = {};
    try { var o = JSON.parse(localStorage.getItem(KEY) || '{}'); Object.keys(o).forEach(function (k) { if (BY[k]) cart[k] = clampQty(o[k], BY[k].flat); }); } catch (e) { cart = {}; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  function total() { var t = 0; Object.keys(cart).forEach(function (k) { t += BY[k].price * cart[k]; }); return t; }
  function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 200; }
  function line(id) { var p = BY[id]; return p.name + ': ' + (p.flat ? '1 year' : cart[id] + ' ' + p.unit + '(s)') + ' x ' + money(p.price) + ' = ' + money(p.price * cart[id]); }

  var CSS = [
    '.mtmc-fab{position:relative;display:inline-flex;flex:0 0 auto;font:inherit;line-height:1;box-sizing:border-box;align-items:center;justify-content:center;width:40px;height:40px;margin-left:14px;border:1.5px solid #cfd6df;border-radius:999px;background:#fff;color:var(--ink,#111827);cursor:pointer;vertical-align:middle;padding:0}',
    '.mtmc-fab:hover{background:var(--soft,#f6f8fb);border-color:var(--acc,#0a66c2);color:var(--acc,#0a66c2)}',
    '.mtmc-fab svg{width:21px;height:21px}',
    '.mtmc-badge{position:absolute;top:-6px;right:-6px;min-width:19px;height:19px;padding:0 5px;border-radius:10px;background:var(--acc,#0a66c2);color:#fff;font:700 11px/19px system-ui,sans-serif;text-align:center;box-sizing:border-box}',
    '.mtmc-hide{display:none!important}',
    '.mtmc-ov{position:fixed;inset:0;background:rgba(11,15,20,.5);z-index:9998}',
    '.mtmc-panel{position:fixed;top:0;right:0;bottom:0;width:min(440px,100vw);background:#fff;z-index:9999;display:flex;flex-direction:column;box-shadow:-12px 0 40px rgba(11,15,20,.25);font:15px/1.5 "Segoe UI",system-ui,-apple-system,Arial,sans-serif;color:var(--ink,#111827)}',
    '.mtmc-head{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:var(--black,#0b0f14);color:#fff}',
    '.mtmc-head h3{margin:0;font-size:18px;color:#fff}',
    '.mtmc-x{border:0;background:rgba(255,255,255,.16);color:#fff;width:32px;height:32px;border-radius:8px;font-size:20px;cursor:pointer;line-height:1}',
    '.mtmc-x:hover{background:rgba(255,255,255,.3)}',
    '.mtmc-body{flex:1;overflow:auto;padding:16px 20px}',
    '.mtmc-foot{padding:14px 0 6px;margin-top:6px;border-top:1px solid var(--line,#e5e7eb)}',
    '.mtmc-item{display:flex;gap:12px;padding:12px;border:1px solid var(--line,#e5e7eb);border-left:4px solid var(--acc,#0a66c2);border-radius:10px;margin-bottom:10px;background:#fff}',
    '.mtmc-item .mtmc-main{flex:1;min-width:0}.mtmc-item b{display:block;font-size:14.5px;line-height:1.3}',
    '.mtmc-meta{font-size:13px;color:var(--mut,#5b6472);margin-top:2px}',
    '.mtmc-row{display:flex;align-items:center;gap:8px;margin-top:8px}',
    '.mtmc-qty,.mtmc-in{padding:8px 10px;border:1px solid #cfd6df;border-radius:8px;font:inherit;background:#fff;box-sizing:border-box}',
    '.mtmc-qty{width:92px}.mtmc-in{width:100%;margin-top:8px}',
    '.mtmc-qty:focus,.mtmc-in:focus{outline:none;border-color:var(--acc,#0a66c2)}',
    '.mtmc-sub{margin-left:auto;font-weight:700}',
    '.mtmc-rm{border:0;background:none;color:#9aa3af;font-size:20px;cursor:pointer;align-self:flex-start;padding:0 4px}.mtmc-rm:hover{color:var(--ink,#111827)}',
    '.mtmc-total{display:flex;justify-content:space-between;align-items:center;font-size:17px;margin-bottom:10px}.mtmc-total b{font-size:22px}',
    '.mtmc-btn{display:block;width:100%;box-sizing:border-box;text-align:center;padding:12px 20px;border:0;border-radius:999px;font:600 15.5px "Segoe UI",system-ui,sans-serif;cursor:pointer;color:#fff!important;text-decoration:none}',
    '.mtmc-btn:hover{text-decoration:none;color:#fff!important}',
    '.mtmc-blue{background:var(--acc,#0a66c2)}.mtmc-blue:hover{background:var(--acc2,#0a4f99)}',
    '.mtmc-black{background:var(--black,#0b0f14)}.mtmc-black:hover{background:#222b36}',
    '.mtmc-btn[disabled],.mtmc-btn.mtmc-off{opacity:.45;cursor:not-allowed;pointer-events:none}',
    '.mtmc-link{border:0;background:none;color:var(--acc,#0a66c2);cursor:pointer;font:inherit;padding:4px 0;text-decoration:underline}',
    '.mtmc-msg{font-size:14px;margin:8px 0}.mtmc-msg.err{color:#b91c1c}.mtmc-msg.ok{color:var(--ink,#111827);font-weight:600}',
    '.mtmc-empty{color:var(--mut,#5b6472);text-align:center;margin:36px 0 16px}',
    '.mtmc-opt{border:2px solid var(--c,#0a66c2);border-radius:14px;padding:14px;margin:12px 0;background:#fff}',
    '.mtmc-opt h4{margin:0 0 4px;font-size:16px}.mtmc-opt p{margin:0 0 10px;font-size:14px;color:var(--mut,#5b6472)}',
    '.mtmc-tag{display:inline-block;margin-left:6px;padding:1px 8px;border-radius:10px;background:var(--soft,#f6f8fb);border:1px solid var(--line,#e5e7eb);color:var(--mut,#5b6472);font-size:12px;font-weight:600;vertical-align:middle}',
    '.mtmc-chk{display:flex;gap:8px;align-items:flex-start;font-size:14px;margin:10px 0}.mtmc-chk input{margin-top:4px}',
    '.mtmc-sum{font-size:13.5px;color:#374151;background:var(--soft,#f6f8fb);border-radius:10px;padding:10px 12px;margin-bottom:12px}.mtmc-sum div{margin:2px 0}'
  ].join('\n');

  function ensureStyle() {
    if (document.getElementById('mtmc-style')) return;
    var st = el('style'); st.id = 'mtmc-style'; st.textContent = CSS; document.head.appendChild(st);
  }
  function svgCart() {
    var NS = 'http://www.w3.org/2000/svg', s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', '21'); s.setAttribute('height', '21'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2');
    s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(NS, 'path'); p.setAttribute('d', 'M3 4h2.2l2.3 10.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L21 8H6.1'); s.appendChild(p);
    [9, 17].forEach(function (cx) { var c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', String(cx)); c.setAttribute('cy', '20'); c.setAttribute('r', '1.4'); s.appendChild(c); });
    return s;
  }
  function mountFab() {
    ensureStyle();
    fab = el('button', 'mtmc-fab mtmc-hide'); fab.type = 'button'; fab.setAttribute('aria-label', 'Open cart'); fab.setAttribute('title', 'Cart');
    fab.appendChild(svgCart()); badge = el('span', 'mtmc-badge', '0'); fab.appendChild(badge);
    fab.onclick = function () { openDrawer('cart'); };
    var a = document.querySelector('header a[href="/account/"]') || document.querySelector('header a[href^="/account"]');
    if (a && a.parentNode) a.parentNode.insertBefore(fab, a.nextSibling);
    else { var h = document.querySelector('header .bar') || document.querySelector('header'); if (h) h.appendChild(fab); else document.body.appendChild(fab); }
  }
  function buildDrawer() {
    if (panel) return;
    ensureStyle();
    overlay = el('div', 'mtmc-ov mtmc-hide'); overlay.onclick = closeDrawer;
    panel = el('div', 'mtmc-panel mtmc-hide'); panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Cart');
    var head = el('div', 'mtmc-head'); titleEl = el('h3', '', 'Your cart'); var x = el('button', 'mtmc-x', '\u00d7'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.onclick = closeDrawer;
    head.appendChild(titleEl); head.appendChild(x); bodyEl = el('div', 'mtmc-body'); panel.appendChild(head); panel.appendChild(bodyEl);
    document.body.appendChild(overlay); document.body.appendChild(panel);
  }
  function openDrawer(s) {
    buildDrawer(); if (s) step = s; if (!Object.keys(cart).length) step = 'cart';
    isOpen = true; overlay.classList.remove('mtmc-hide'); panel.classList.remove('mtmc-hide'); render(); prefill();
  }
  function closeDrawer() { isOpen = false; if (panel) { overlay.classList.add('mtmc-hide'); panel.classList.add('mtmc-hide'); } }
  function msg(text, cls) { if (msgEl) { msgEl.textContent = text; msgEl.className = 'mtmc-msg' + (cls ? ' ' + cls : ''); } }

  function render() {
    var ids = Object.keys(cart), n = ids.length;
    fab.classList.toggle('mtmc-hide', n === 0); badge.textContent = String(n);
    if (!panel) return;
    bodyEl.textContent = ''; mailLink = null; msgEl = null;
    if (!n) {
      titleEl.textContent = 'Your cart'; bodyEl.appendChild(el('p', 'mtmc-empty', 'Your cart is empty.'));
      var s = el('a', 'mtmc-btn mtmc-blue', 'See pricing'); s.href = '/pricing.html'; bodyEl.appendChild(s); return;
    }
    if (step === 'pay') renderPay(ids); else renderCart(ids);
  }
  function renderCart(ids) {
    titleEl.textContent = 'Your cart ('+ ids.length + ')';
    var list = el('div');
    ids.forEach(function (id) {
      var p = BY[id], it = el('div', 'mtmc-item'), main = el('div', 'mtmc-main');
            main.appendChild(el('b', '', p.name)); main.appendChild(el('div', 'mtmc-meta', money(p.price) + ' / ' + p.unit + ' \u00b7 ' + p.term));
      var row = el('div', 'mtmc-row');
      if (p.flat) row.appendChild(el('span', '', '1 year')); else {
        var q = el('input', 'mtmc-qty'); q.type = 'number'; q.min = '1'; q.max = String(MAXQ); q.value = String(cart[id]);
        q.onchange = function () { cart[id] = clampQty(q.value); save(); render(); }; row.appendChild(q); row.appendChild(el('span', '', p.unit + '(s)'));
      }
      row.appendChild(el('span', 'mtmc-sub', money(p.price * cart[id]))); main.appendChild(row); it.appendChild(main);
      var rm = el('button', 'mtmc-rm', '\u00d7'); rm.type = 'button'; rm.setAttribute('aria-label', 'Remove ' + p.name); rm.onclick = function () { delete cart[id]; save(); render(); }; it.appendChild(rm);
      list.appendChild(it);
    });
    bodyEl.appendChild(list);
    var clr = el('button', 'mtmc-link', 'Clear cart'); clr.type = 'button'; clr.onclick = function () { cart = {}; save(); render(); }; bodyEl.appendChild(clr);
    var t = total(), foot = el('div', 'mtmc-foot'), tr = el('div', 'mtmc-total'); tr.appendChild(el('span', '', 'Total')); tr.appendChild(el('b', '', money(t))); foot.appendChild(tr);
    msgEl = el('p', 'mtmc-msg'); foot.appendChild(msgEl);
    var go = el('button', 'mtmc-btn mtmc-blue', 'Checkout'); go.type = 'button';
    if (t < MIN_ORDER) { msg('Minimum order is ' + money(MIN_ORDER) + '. Add ' + money(MIN_ORDER - t) + ' more.', 'err'); go.disabled = true; }
    go.onclick = function () { if (total() < MIN_ORDER) return; step = 'pay'; render(); };
    foot.appendChild(go);
    var more = el('a', 'mtmc-link', 'Continue shopping'); more.href = '/pricing.html';
    more.onclick = function (ev) { if (/\/pricing(\.html)?\/?$/.test(location.pathname)) { ev.preventDefault(); closeDrawer(); } };
    foot.appendChild(more); bodyEl.appendChild(foot);
  }
  function updateMail() {
    if (!mailLink) return;
    var body = 'Hello MTMover,\n\nI would like to order:\n\n' + Object.keys(cart).map(line).join('\n') + '\n\nTotal: ' + money(total()) + '\nMTMover account email: ' + email + '\n\nPlease send me the payment link.\n';
    mailLink.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('MTMover order') + '&body=' + encodeURIComponent(body);
  }
  function renderPay(ids) {
    titleEl.textContent = 'Checkout';
    var sum = el('div', 'mtmc-sum'); ids.forEach(function (id) { sum.appendChild(el('div', '', line(id))); });
    sum.appendChild(el('div', '', 'Total: ' + money(total()))); bodyEl.appendChild(sum);
    bodyEl.appendChild(el('p', 'mtmc-meta', 'The license is added to the MTMover account with this email.'));
    var em = el('input', 'mtmc-in'); em.type = 'email'; em.placeholder = 'Your MTMover account email'; em.value = email; em.setAttribute('autocomplete', 'email');
    em.oninput = function () { email = em.value.trim(); updateMail(); }; bodyEl.appendChild(em);
    var lab = el('label', 'mtmc-chk'), cb = el('input'); cb.type = 'checkbox'; cb.checked = agree; cb.onchange = function () { agree = cb.checked; };
    var sp = el('span', '', 'I agree to the '); [['Terms of Use', '/terms.html'], ['License Agreement', '/eula.html'], ['Refund Policy', '/refund.html']].forEach(function (l, i) {
      var a = el('a', '', l[0]); a.href = l[1]; a.target = '_blank'; sp.appendChild(a); sp.appendChild(document.createTextNode(i === 0 ? ', ' : i === 1 ? ' and ' : ' (7 days refund).'));
    });
    lab.appendChild(cb); lab.appendChild(sp); bodyEl.appendChild(lab);
    msgEl = el('p', 'mtmc-msg'); bodyEl.appendChild(msgEl);
    function ready() {
      if (!validEmail(email)) { msg('Enter the email of your MTMover account.', 'err'); return false; }
      if (!agree) { msg('Please accept the terms to continue.', 'err'); return false; }
      return true;
    }
    var a1 = el('div', 'mtmc-opt'); a1.setAttribute('style', '--c:#0a66c2');
    var h1 = el('h4', '', 'Pay online by card'); if (!PAYMENT_ENABLED) h1.appendChild(el('span', 'mtmc-tag', 'Coming soon'));
    a1.appendChild(h1); a1.appendChild(el('p', '', 'Pay by card on a secure payment page. Your license is added to your account automatically.'));
    var pay = el('button', 'mtmc-btn mtmc-blue', 'Pay now'); pay.type = 'button'; pay.disabled = !PAYMENT_ENABLED;
    pay.onclick = function () { if (PAYMENT_ENABLED && ready() && window.MTMCart.onPay) window.MTMCart.onPay({ email: email, cart: JSON.parse(JSON.stringify(cart)), total: total() }); };
    a1.appendChild(pay); bodyEl.appendChild(a1);
    var a2 = el('div', 'mtmc-opt'); a2.setAttribute('style', '--c:#0b0f14');
    a2.appendChild(el('h4', '', 'Contact us by email')); a2.appendChild(el('p', '', 'We reply with a payment link, and an invoice if you need one. Ask for a better price on large orders.'));
    mailLink = el('a', 'mtmc-btn mtmc-black', 'Send order by email'); mailLink.href = '#';
    mailLink.onclick = function (ev) { if (!ready()) { ev.preventDefault(); return; } msg('Your email app should open with the order. If it does not, write to ' + MAIL + '.', 'ok'); };
    a2.appendChild(mailLink); bodyEl.appendChild(a2); updateMail();
    var back = el('button', 'mtmc-link', '\u2190 Back to cart'); back.type = 'button'; back.onclick = function () { step = 'cart'; render(); }; bodyEl.appendChild(back);
  }
  async function prefill() {
    var t; try { t = localStorage.getItem(TOKEN); } catch (e) {}
    if (!t || email) return;
    try {
      var r = await fetch(API + '/v1/web/summary', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: t }) });
      var j = await r.json();
      if (j && j.ok && j.email && !email) { email = j.email; if (isOpen && step === 'pay') render(); }
    } catch (e) {}
  }
  function add(id, qty) {
    var p = BY[id]; if (!p) return;
    cart[id] = p.flat ? 1 : Math.min(MAXQ, (cart[id] || 0) + clampQty(qty));
    save(); openDrawer('cart');
  }
  /* S17: online payment with Paddle. The license server creates the checkout (prices never come from the browser) and grants the license from Paddle's webhook. */
  var paddleReady = false, paying = false;
  function paddleScript(cb) {
    if (window.Paddle) return cb(null);
    var s = document.createElement('script'); s.src = 'https://cdn.paddle.com/paddle/v2/paddle.js'; s.async = true;
    s.onload = function () { cb(window.Paddle ? null : new Error('Paddle did not load')); };
    s.onerror = function () { cb(new Error('Paddle did not load')); };
    document.head.appendChild(s);
  }
  function paddleInit(cfg) {
    if (paddleReady) return true;
    try {
      if (cfg.env === 'sandbox' && window.Paddle.Environment) window.Paddle.Environment.set('sandbox');
      window.Paddle.Initialize({ token: cfg.token, eventCallback: paddleEvent });
      paddleReady = true;
      return true;
    } catch (e) { return false; }
  }
  function paddleEvent(ev) { if (ev && ev.name === 'checkout.completed') paymentDone(); }
  function paymentDone() {
    cart = {}; save(); step = 'cart'; paying = false; render();
    if (bodyEl && bodyEl.insertBefore) bodyEl.insertBefore(el('p', 'mtmc-msg ok', 'Payment received. Your license is added to your account within a minute and Paddle emails your receipt. Open My licenses in the app, or My account on this site.'), bodyEl.firstChild || null);
  }
  function payNow(info) {
    var cfg = window.MTM_PADDLE || {};
    if (!cfg.token || paying) return;
    var tok = '';
    try { tok = localStorage.getItem(TOKEN) || ''; } catch (e) {}
    if (!tok) { msg('Please sign in first (Sign in, top right), then open the cart again. The license is added to the account you sign in with.', 'err'); return; }
    paying = true; msg('Preparing your secure checkout...', 'ok');
    var items = Object.keys(info.cart).map(function (id) { return { sku: id, qty: info.cart[id] }; });
    fetch(API + '/v1/checkout/create', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: tok, items: items }) })
      .then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); })
      .then(function (x) {
        if (!x.j || !x.j.ok) {
          paying = false;
          if (x.s === 401) { try { localStorage.removeItem(TOKEN); } catch (e) {} }
          msg((x.j && x.j.message) || 'Could not start the checkout. Please try again, or order by email.', 'err');
          return;
        }
        paddleScript(function (err) {
          if (err || !paddleInit(cfg)) { paying = false; msg('The payment window could not load. Turn off your ad blocker for this site, or order by email below.', 'err'); return; }
          paying = false;
          var who = x.j.email || info.email;
          msg(who && info.email && who.toLowerCase() !== info.email.toLowerCase() ? 'The license will be added to the account you are signed in with: ' + who : '', who && info.email && who.toLowerCase() !== info.email.toLowerCase() ? 'ok' : '');
          try { window.Paddle.Checkout.open({ transactionId: x.j.transaction_id, customer: { email: who }, settings: { displayMode: 'overlay', theme: 'light', allowLogout: false } }); }
          catch (e) { msg('Could not open the checkout. Please order by email below.', 'err'); }
        });
      })
      .catch(function () { paying = false; msg('Cannot reach the server. Check your connection and try again, or order by email below.', 'err'); });
  }
  load(); mountFab(); render();
  window.addEventListener('storage', function (e) { if (e.key === KEY || e.key === null) { load(); render(); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isOpen) closeDrawer(); });
  window.MTMCart = { PRODUCTS: PRODUCTS, MIN_ORDER: MIN_ORDER, money: money, clampQty: clampQty, add: add, open: openDrawer, close: closeDrawer, onPay: payNow };
})();