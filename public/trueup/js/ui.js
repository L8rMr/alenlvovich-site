/* TrueUp shell: two interface themes over the same app.
   - "modern": a finance-suite layout (left navigation, page header, accounting number formats)
   - "w95":    the same program as if it shipped in 1995 (title bar, menu bar, toolbar, status bar)
   - "hw":     a hardware control panel (moulded panels, round keys, display tiles)
   - "swiss":  Swiss grid typography (black on white, one red, heavy rules, big numbers)
   The choice is stored per browser in localStorage("tu-ui"). */
(function () {
  var KEY = 'tu-ui';
  var ui = 'modern';
  try { ui = localStorage.getItem(KEY) || 'modern'; } catch (e) {}
  var UIS = ['w95', 'modern', 'hw', 'swiss'];
  if (UIS.indexOf(ui) < 0) ui = 'modern';
  document.documentElement.setAttribute('data-ui', ui);

  var ROUTES = {
    analytics: ['Overview', 'Dashboard'],
    items: ['Controls', 'Project Audit'],
    staffing: ['Controls', 'Staffing Audit'],
    tracking: ['Reporting', 'Budget Tracker'],
    ledgr: ['Reporting', 'Actuals'],
    forecast: ['Planning', 'Forecast'],
    changes: ['Planning', 'Change Log'],
    config: ['Administration', 'Configuration'],
    guide: ['Help', 'Guide']
  };
  var ACC = { po: 'PO Accrual', crew: 'Crew Accrual', flash: 'Flash', pl: 'P&L', fa: 'Finance Actuals' };

  function pageInfo() {
    var h = (location.hash || '#/analytics').replace(/^#\/?/, '').split('?')[0];
    var p = h.split('/');
    if (!p[0]) return ['Overview', 'Dashboard', ''];
    if (p[0] === 'accruals') {
      var org = p[1] === 'marketing' ? 'Org 2' : 'Org 1';
      return ['Close', ACC[p[2]] || 'Accruals', org];
    }
    var r = ROUTES[p[0]] || ['Overview', 'Dashboard'];
    return [r[0], r[1], ''];
  }

  function setUI(v) {
    ui = v;
    try { localStorage.setItem(KEY, v); } catch (e) {}
    document.documentElement.setAttribute('data-ui', v);
    paint();
    window.dispatchEvent(new Event('resize')); // charts re-measure for the new layout
  }

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }

  var bar, title, crumbs, w95title, w95status, sw;

  function build() {
    var top = document.querySelector('header.top');
    if (!top || document.getElementById('uibar')) return;

    // Sidebar group labels (modern) — the nav order already follows the planning → close cycle.
    [['tab-analytics', 'Overview'], ['tab-items', 'Controls'], ['tab-tracking', 'Reporting'], ['nav-fc', 'Planning'], ['nav-acc', 'Close']]
      .forEach(function (g) {
        var a = document.getElementById(g[0]);
        if (a && a.parentNode) a.parentNode.insertBefore(el('div', { 'class': 'uigrp', 'aria-hidden': 'true' }, g[1]), a);
      });

    // Theme switch, at the foot of the sidebar (modern) or in the menu bar (1995)
    sw = el('div', { 'class': 'uiswitch', role: 'group', 'aria-label': 'Interface' },
      '<span class="uisw-l">Interface</span>' +
      '<button type="button" data-ui="w95" title="Windows 95">1995</button>' +
      '<button type="button" data-ui="modern" title="Modern finance suite">Modern</button>' +
      '<button type="button" data-ui="hw" title="Hardware panel">Panel</button>' +
      '<button type="button" data-ui="swiss" title="Swiss grid">Swiss</button>');
    sw.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-ui]');
      if (b) setUI(b.getAttribute('data-ui'));
    });

    // Page header bar (modern) — title + breadcrumb, with search and data health moved into it
    bar = el('div', { id: 'uibar' });
    var left = el('div', { 'class': 'uib-l' });
    crumbs = el('div', { 'class': 'uicrumbs' });
    title = el('h2', { 'class': 'uititle' });
    left.appendChild(crumbs); left.appendChild(title);
    bar.appendChild(left);
    var util = document.querySelector('.utilrow');
    if (util) util.parentNode.insertBefore(bar, util);
    // Right side of the page header: search, interface switch, and a way back to the main site
    var right = el('div', { 'class': 'uir' });
    var ctl = document.querySelector('.utilctl');
    if (ctl) right.appendChild(ctl);
    right.appendChild(sw);
    right.appendChild(el('a', { 'class': 'uihome', href: '/', title: 'Back to alenlvovich.com' },
      '<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 7.5L8 2.5l6 5M3.8 6.3V13.5h3v-4h2.4v4h3V6.3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg><span>alenlvovich.com</span>'));
    bar.appendChild(right);

    // 1995 chrome: title bar and status bar
    w95title = el('div', { id: 'w95title', 'aria-hidden': 'true' },
      '<span class="w95-ico"></span><span class="w95-t"></span><span class="w95-btns"><i>_</i><i>□</i><i>×</i></span>');
    document.body.insertBefore(w95title, document.body.firstChild);
    w95status = el('div', { id: 'w95status', 'aria-hidden': 'true' },
      '<span class="s1">Ready</span><span class="s2"></span><span class="s3"></span><span class="s4">NUM</span>');
    document.body.appendChild(w95status);
  }

  function txt(node, v) { if (node && node.textContent !== v) node.textContent = v; }
  function paint() {
    if (!bar) return;
    var i = pageInfo();
    txt(title, i[1]);
    txt(crumbs, 'TrueUp  ›  ' + i[0] + (i[2] ? '  ›  ' + i[2] : ''));
    txt(w95title.querySelector('.w95-t'), 'TrueUp 1.0 for Windows 95 - [' + i[1] + (i[2] ? ' - ' + i[2] : '') + ']');
    var fq = document.getElementById('fq');
    txt(w95status.querySelector('.s2'), i[0] + ': ' + i[1]);
    var ft = fq ? fq.textContent : '', q = /Q(\d)\s*FY\s*(\d\d)/.exec(ft), el2 = /(\d+)%\s*elapsed/.exec(ft);
    txt(w95status.querySelector('.s3'), q ? 'Fiscal Q' + q[1] + ' FY' + q[2] + (el2 ? ' · ' + el2[1] + '% of quarter elapsed' : '') : '');
    if (document.title !== i[1] + ' · TrueUp') document.title = i[1] + ' · TrueUp';
    var cur = (location.hash || '#/analytics').split('?')[0];
    [].forEach.call(document.querySelectorAll('header.top .navsub a[href^="#/"]'), function (a) {
      var on = a.getAttribute('href') === cur;
      if (a.classList.contains('uion') !== on) a.classList.toggle('uion', on);
    });
    [].forEach.call(sw.querySelectorAll('button'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-ui') === ui ? 'true' : 'false');
    });
  }

  /* Accounting presentation: negative amounts in parentheses, e.g. -$1,234 → ($1,234).
     Only plain numeric text in table cells and summary figures is touched. */
  var NEG = /^\s*[-−–]\s?(\$?[\d,]+(?:\.\d+)?\s?[KMB]?%?)\s*$/;
  var SCOPE = 'td, th, .v, .fcard b, .card b, .dbk b, .num, b';
  function acct(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n, hits = [];
    while ((n = w.nextNode())) {
      var t = n.nodeValue;
      if (t.length > 24 || !/[-−–]/.test(t)) continue;
      var m = NEG.exec(t);
      if (!m) continue;
      var p = n.parentElement;
      if (!p || p.isContentEditable || p.closest('input,textarea,select,svg,script,style') || !p.closest(SCOPE)) continue;
      hits.push([n, m[1], p]);
    }
    hits.forEach(function (h) { h[0].nodeValue = '(' + h[1] + ')'; h[2].classList.add('acct-neg'); });
  }
  var pending = false;
  var mo = new MutationObserver(function () {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; mo.disconnect(); acct(document.body); paint(); observe(); });
  });
  function observe() { mo.observe(document.body, { childList: true, subtree: true, characterData: true }); }

  function start() { build(); paint(); acct(document.body); observe(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.addEventListener('hashchange', paint);
  window.TrueUpUI = { set: setUI, get: function () { return ui; } };
})();
