// ============================================================
// 绑定层：视图钩子 ↔ 数据的桥梁（DOM 工具 + 弹层宿主）
// 钩子契约：
//   data-ot="名字"              挂载点（容器/模板）
//   data-bind="路径"            填文本
//   data-bind-html="路径"       填 HTML
//   data-read / data-bind-value 填输入框值，data-read 同时用于取值
//   data-bind-class="路径"      切 class（值形如 'is-on'，空串则清除）
//   data-bind-style="width=pct%" 设内联样式（= 号后为路径，可带 % / px 后缀）
//   data-bind-if="路径"         控制显隐（空/false/0 则隐藏）
//   data-act="动作名" + data-arg + data-confirm  点击行为
// ============================================================
OT.view = (function () {
  function elFromHtml(html) {
    var d = document.createElement('div');
    d.innerHTML = String(html == null ? '' : html).trim();
    return d.firstElementChild || d;
  }
  function pathVal(vm, path) {
    var p = String(path == null ? '' : path).split('.');
    var v = vm;
    for (var i = 0; i < p.length; i++) {
      if (v === null || v === undefined) return '';
      v = v[p[i]];
    }
    return (v === null || v === undefined) ? '' : v;
  }
  function all(root, sel) {
    var out = [];
    if (!root) return out;
    if (root.querySelectorAll) {
      var list = root.querySelectorAll(sel);
      for (var i = 0; i < list.length; i++) out.push(list[i]);
    }
    if (root.matches && root.matches(sel)) out.unshift(root);
    return out;
  }
  function isFalse(v) { return v === '' || v === false || v === 0 || v === null || v === undefined; }

  function fill(root, vm) {
    if (!root) return;
    vm = vm || {};
    all(root, '[data-bind]').forEach(function (n) {
      n.textContent = String(pathVal(vm, n.getAttribute('data-bind')));
    });
    all(root, '[data-bind-html]').forEach(function (n) {
      n.innerHTML = String(pathVal(vm, n.getAttribute('data-bind-html')));
    });
    all(root, '[data-read], [data-bind-value]').forEach(function (n) {
      if (document.activeElement === n) return;
      var key = n.getAttribute('data-read') || n.getAttribute('data-bind-value');
      n.value = String(pathVal(vm, key));
    });
    all(root, '[data-bind-class]').forEach(function (n) {
      var v = String(pathVal(vm, n.getAttribute('data-bind-class')));
      String(n.__otCls || '').split(' ').forEach(function (c) { if (c) n.classList.remove(c); });
      v.split(' ').forEach(function (c) { if (c) n.classList.add(c); });
      n.__otCls = v;
    });
    all(root, '[data-bind-style]').forEach(function (n) {
      var spec = String(n.getAttribute('data-bind-style') || '');
      var i = spec.indexOf('=');
      if (i < 0) return;
      var prop = spec.slice(0, i), path = spec.slice(i + 1), suffix = '';
      var m = /(%|px)$/.exec(path);
      if (m) { suffix = m[1]; path = path.slice(0, path.length - suffix.length); }
      var v = pathVal(vm, path);
      // 0 / false 是合法值（如 width=0%），只有空串与空值才跳过
      n.style[prop] = (v === '' || v === null || v === undefined) ? '' : (v + suffix);
    });
    all(root, '[data-bind-if]').forEach(function (n) {
      n.style.display = isFalse(pathVal(vm, n.getAttribute('data-bind-if'))) ? 'none' : '';
    });
  }

  // 列表渲染：tpl 为 <template>，rows 为数据数组，fillFn(node, row, i) 逐行填充
  function list(container, tpl, rows, fillFn) {
    if (!container) { warn('缺少列表容器'); return; }
    if (!tpl) { warn('缺少列表行模板（<template data-ot="row">）'); return; }
    container.innerHTML = '';
    (rows || []).forEach(function (r, i) {
      var frag = tpl.content ? tpl.content.cloneNode(true) : tpl.cloneNode(true);
      var node = frag.firstElementChild;
      if (!node) return;
      if (fillFn) fillFn(node, r, i);
      container.appendChild(node);
    });
  }
  function slot(root, name) { return root ? root.querySelector('[data-ot="' + name + '"]') : null; }
  // 按名字读取所有 data-read 字段的值（保存弹层时用）
  function readValues(root) {
    var out = {};
    all(root, '[data-read]').forEach(function (n) { out[n.getAttribute('data-read')] = n.value; });
    return out;
  }
  function warn(msg) { console.warn('[view] ' + msg); }

  return { elFromHtml: elFromHtml, pathVal: pathVal, all: all, fill: fill, list: list, slot: slot, readValues: readValues, warn: warn };
})();

// ---------- 弹层宿主 ----------
OT.modal = (function () {
  var mask = null, modal = null;
  return {
    init: function (maskEl, modalEl) { mask = maskEl; modal = modalEl; },
    root: function () { return modal; },
    open: function (html, vm, full) {
      if (!modal) return;
      modal.innerHTML = String(html || '');
      modal.classList.toggle('is-full', !!full);   // 全屏弹层（如背景裁剪）
      if (vm) OT.view.fill(modal, vm);
      if (mask) mask.classList.add('is-open');
    },
    fill: function (vm) { if (modal) OT.view.fill(modal, vm); },
    isOpen: function () { return !!(mask && mask.classList.contains('is-open')); },
    close: function () {
      if (mask) mask.classList.remove('is-open');
      if (modal) modal.innerHTML = '';
    }
  };
})();
