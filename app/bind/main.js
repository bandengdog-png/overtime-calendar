// ============================================================
// 绑定层：引导（背景层 / 顶栏 / 页面 / 底部 Tab / 弹层 / Toast / 跨天刷新）
// ============================================================
OT.mount = (function () {
  var els = {};
  var lastDay = '';

  function build(appEl) {
    OT.appEl = appEl;
    appEl.classList.add('ot-app');
    appEl.innerHTML = '';
    appEl.appendChild(OT.view.elFromHtml(OT.tpl.bg));      // 背景层（z-index 0，需先于内容）
    appEl.appendChild(OT.view.elFromHtml(OT.tpl.top));
    els.main = OT.view.elFromHtml('<div class="ot-main"></div>');
    appEl.appendChild(els.main);
    appEl.appendChild(OT.view.elFromHtml(OT.tpl.tabbar));
    appEl.appendChild(OT.view.elFromHtml(OT.tpl.mask));
    els.toast = OT.view.elFromHtml('<div class="ot-toast"></div>');
    appEl.appendChild(els.toast);
    OT.modal.init(OT.view.slot(appEl, 'mask'), OT.view.slot(appEl, 'modal'));
  }

  function toastUI(msg) {
    if (!els.toast) return;
    els.toast.textContent = String(msg == null ? '' : msg);
    els.toast.classList.add('is-show');
    clearTimeout(toastUI._t);
    toastUI._t = setTimeout(function () { els.toast.classList.remove('is-show'); }, 2000);
  }

  // 把设置里的外观项写进 CSS 变量（透明度 / 模糊 / 背景位置与缩放），改一次全站生效
  function applySettings() {
    var s = OT.data.settings.all();
    var d = OT.contract.setDefaults;
    var root = document.documentElement;

    var a = Number(s.cardAlpha); if (!isFinite(a) || a <= 0) a = d.cardAlpha;
    var bl = Number(s.blur); if (!isFinite(bl) || bl < 0) bl = d.blur;
    var z = Number(s.bgZoom); if (!isFinite(z) || z <= 0) z = 1;
    var x = Number(s.bgX); if (!isFinite(x)) x = 50;
    var y = Number(s.bgY); if (!isFinite(y)) y = 50;

    root.style.setProperty('--card-alpha', String(Math.min(1, Math.max(0.3, a))));
    root.style.setProperty('--blur', Math.min(24, bl) + 'px');
    root.style.setProperty('--bg-zoom', String(Math.min(3, Math.max(1, z))));
    root.style.setProperty('--bg-x', Math.min(100, Math.max(0, x)) + '%');
    root.style.setProperty('--bg-y', Math.min(100, Math.max(0, y)) + '%');

    // 自定义背景是 data URL；没有则移除，回到 tokens.css 里以 CSS 文件为基准的内置图路径
    if (s.bgImage) root.style.setProperty('--bg-photo', 'url("' + s.bgImage + '")');
    else root.style.removeProperty('--bg-photo');

    if (OT.appEl) OT.appEl.classList.toggle('is-ghost', !!s.ghost);
  }

  function refreshTop() {
    var s = OT.data.settings.all();
    OT.view.fill(OT.appEl.querySelector('.ot-top'), {
      appName: OT.config.appName,
      topBadge: OT.stats.monthSummaryText(OT.state.y, OT.state.m, s)
    });
  }

  function goto(id) {
    OT.state.page = id || 'home';
    if (OT.modal.isOpen()) OT.modal.close();
    render();
  }

  function render() {
    var page = OT.state.page;
    els.main.innerHTML = '';
    var html = OT.tpl[page];
    if (!html) {
      els.main.appendChild(OT.view.elFromHtml('<div class="ot-empty">页面未定义：' + page + '</div>'));
      return;
    }
    var root = OT.view.elFromHtml(html);
    els.main.appendChild(root);
    var fn = OT.pages[page];
    if (fn) { try { fn(root); } catch (e) { console.error('[page] ' + page, e); } }
    refreshTop();
    OT.view.all(OT.appEl, '.ot-tab').forEach(function (b) {
      b.classList.toggle('is-on', b.getAttribute('data-arg') === page);
    });
    var scroller = els.main.querySelector('.ot-page');
    if (scroller) scroller.scrollTop = 0;
  }

  function boot(sel) {
    var appEl = (typeof sel === 'string') ? document.querySelector(sel) : sel;
    if (!appEl) { console.error('[mount] 找不到容器：' + sel); return; }
    build(appEl);
    OT.bridge._toastUI = toastUI;
    OT.actions.bind(appEl);
    applySettings();
    lastDay = OT.datex.today();
    goto(OT.state.page || (OT.config.tabs[0] || 'home'));
    // 跨天自动刷新（手机长期挂在后台再打开时）
    if (!boot._timer) {
      boot._timer = setInterval(function () {
        var t = OT.datex.today();
        if (t !== lastDay) { lastDay = t; render(); }
      }, 30000);
    }
  }

  return {
    boot: boot, goto: goto, render: render, refreshTop: refreshTop,
    applySettings: applySettings, toast: toastUI
  };
})();

document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('ot-app')) OT.mount.boot('#ot-app');
});
