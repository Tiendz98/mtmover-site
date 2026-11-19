/* MTMover account page: "Account settings" card (email, change password, computers, delete account). Rendered inside #dash, so it only shows when signed in. */
(function () {
  'use strict';
  var dash = document.getElementById('dash');
  if (!dash || document.getElementById('settings')) return;
  var TOKEN = 'mtm_web_token', API = 'https://mtmover-license.mtmover.workers.dev', MAIL = 'contact@mtmover.tech';
  var tok = '', email = '', box, emailEl, pwMsg, listEl, listMsg, pending = null;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function getTok() { try { return localStorage.getItem(TOKEN) || ''; } catch (e) { return ''; } }
  function call(path, body) {
    return fetch(API + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j || {} }; }); });
  }
  function say(node, text, ok) { node.className = 'ac-msg' + (text ? (ok ? ' ok' : ' err') : ''); node.textContent = text || ''; }
  function dt(sec) { return sec ? new Date(sec * 1000).toISOString().slice(0, 16).replace('T', ' ') : ''; }
  function drawMachines(list) {
    listEl.textContent = '';
    if (!list.length) { listEl.appendChild(el('p', 'ac-sub', 'No computer has signed in to the MTMover app with this account yet.')); return; }
    var wrapT = el('div', 'tw'), t = el('table', 'tbl'), thead = el('thead'), hr = el('tr');
    ['Computer', 'First sign-in', 'Last seen', ''].forEach(function (h) { hr.appendChild(el('th', '', h)); });
    thead.appendChild(hr); t.appendChild(thead);
    var tb = el('tbody');
    list.forEach(function (m) {
      var tr = el('tr');
      tr.appendChild(el('td', '', (m.label ? m.label + ' ' : '') + '(ID ' + String(m.id).slice(0, 8) + ')'));
      tr.appendChild(el('td', '', dt(m.first_seen))); tr.appendChild(el('td', '', dt(m.last_seen)));
      var td = el('td'), b = el('button', 'ac-btn', 'Remove'); b.type = 'button'; b.style.marginBottom = '0';
      b.onclick = function () {
        if (pending !== m.id) { pending = m.id; b.textContent = 'Click again to confirm'; setTimeout(function () { if (pending === m.id) { pending = null; b.textContent = 'Remove'; } }, 5000); return; }
        pending = null; b.disabled = true;
        call('/v1/web/machines/remove', { token: tok, machine_id: m.id }).then(function (x) {
          if (x.j.ok) { say(listMsg, 'Computer removed. It must sign in again to use MTMover.', true); loadMachines(); }
          else { b.disabled = false; b.textContent = 'Remove'; say(listMsg, x.j.message || 'Could not remove the computer.'); }
        }).catch(function () { b.disabled = false; b.textContent = 'Remove'; say(listMsg, 'Cannot reach the server.'); });
      };
      td.appendChild(b); tr.appendChild(td); tb.appendChild(tr);
    });
    t.appendChild(tb); wrapT.appendChild(t); listEl.appendChild(wrapT);
  }
  function loadMachines() {
    if (!tok) return;
    call('/v1/web/machines', { token: tok }).then(function (x) { if (x.j.ok) drawMachines(x.j.machines || []); else if (x.s !== 401) say(listMsg, x.j.message || 'Could not load your computers.'); }).catch(function () {});
  }
  function loadMe() {
    if (!tok) return;
    call('/v1/web/me', { token: tok }).then(function (x) { if (x.j.ok) { email = x.j.email; emailEl.textContent = email; } }).catch(function () {});
  }
  function build() {
    box = el('div'); box.id = 'settings';
    box.appendChild(el('h2', '', 'Account settings'));
    var p = el('p', 'ac-sub'); p.appendChild(document.createTextNode('Account email: ')); emailEl = el('b', '', '...'); p.appendChild(emailEl); box.appendChild(p);
    box.appendChild(el('h3', '', 'Change password'));
    var f = el('form'); f.setAttribute('autocomplete', 'on'); f.style.maxWidth = '420px';
    function inp(ph, ac) { var i = el('input'); i.type = 'password'; i.placeholder = ph; i.setAttribute('autocomplete', ac); return i; }
    var cur = inp('Current password', 'current-password'), nw = inp('New password (8 to 128 characters)', 'new-password'), nw2 = inp('Confirm new password', 'new-password');
    pwMsg = el('div', 'ac-msg'); var go = el('button', 'ac-btn ac-pri', 'Change password'); go.type = 'submit';
    f.appendChild(cur); f.appendChild(nw); f.appendChild(nw2); f.appendChild(pwMsg); f.appendChild(go); box.appendChild(f);
    f.onsubmit = function (ev) {
      ev.preventDefault(); say(pwMsg, '');
      if (!cur.value) return say(pwMsg, 'Enter your current password.');
      if (nw.value.length < 8) return say(pwMsg, 'The new password must have at least 8 characters.');
      if (nw.value !== nw2.value) return say(pwMsg, 'The new passwords do not match.');
      go.disabled = true;
      call('/v1/web/password/change', { token: tok, current: cur.value, password: nw.value }).then(function (x) {
        go.disabled = false;
        if (x.j.ok) { cur.value = ''; nw.value = ''; nw2.value = ''; say(pwMsg, 'Password changed. Your other computers were signed out.', true); }
        else say(pwMsg, x.j.message || 'Could not change the password.');
      }).catch(function () { go.disabled = false; say(pwMsg, 'Cannot reach the server. Try again.'); });
    };
    box.appendChild(el('h3', '', 'Computers'));
    box.appendChild(el('p', 'ac-sub', 'Computers that signed in to the MTMover app with this account. Remove one you no longer use: it is signed out and must sign in again.'));
    listMsg = el('div', 'ac-msg'); box.appendChild(listMsg); listEl = el('div'); box.appendChild(listEl);
    box.appendChild(el('h3', '', 'Delete my account'));
    var d = el('p', 'ac-sub'); d.appendChild(document.createTextNode('To delete your account and its data, send the request from your account email. Licenses already used are not refunded after the refund period. '));
    var a = el('a', '', 'Request deletion'); a.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Delete my MTMover account'); d.appendChild(a); d.appendChild(document.createTextNode('.')); box.appendChild(d);
    dash.appendChild(box);
  }
  function refresh() { tok = getTok(); if (!tok) return; loadMe(); loadMachines(); if (location.hash === '#settings' && box.scrollIntoView) { setTimeout(function () { box.scrollIntoView({ behavior: 'smooth' }); }, 400); } }
  build(); refresh();
  setInterval(function () { if (getTok() !== tok) refresh(); }, 1200);
})();