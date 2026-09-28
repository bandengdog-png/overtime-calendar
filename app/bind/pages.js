// ============================================================
// 绑定层：各页面的渲染 + 动作注册（视图与逻辑在此对接）
// 业务算法一律调用 logic/ 与 data/，本文件只做「数据组装 + 填充视图」
// ============================================================
(function () {
  var D = OT.datex;
  var now = new Date();
  OT.state = OT.state || {};
  OT.state.page = OT.state.page || 'home';
  OT.state.y = OT.state.y || now.getFullYear();
  OT.state.m = OT.state.m || (now.getMonth() + 1);
  OT.state.pickYmd = OT.state.pickYmd || D.today();
  OT.state.range = OT.state.range || 'month';
  OT.state.editYmd = '';
  OT.state.editType = 'weekday';
  OT.state.crop = null;          // 背景裁剪中的临时值 {x, y, zoom}

  function settings() { return OT.data.settings.all(); }
  function allRecs() {
    var map = OT.data.all(), out = [];
    for (var k in map) { var r = map[k]; r.ymd = k; out.push(r); }
    return out;
  }
  function rateText(t) { return OT.contract.TYPE_LABEL[t] || t; }
  function clamp(v, a, b) {
    v = Number(v);
    if (!isFinite(v)) return (a + b) / 2;
    return Math.min(b, Math.max(a, v));
  }

  /* ---------- 今日 ---------- */
  function renderHome(root) {
    var s = settings();
    var vm = OT.punch.viewModel(D.today(), s);
    vm.monthSummary = OT.stats.monthSummaryText(OT.state.y, OT.state.m, s);
    OT.view.fill(root, vm);
  }

  /* ---------- 日历 ---------- */
  function renderCal(root) {
    var s = settings(), y = OT.state.y, m = OT.state.m;
    var grid = OT.view.slot(root, 'grid');
    var tplRow = OT.view.slot(root, 'row');
    if (!grid) { OT.view.warn('日历页缺少 data-ot="grid" 容器'); return; }

    // 先填页头文字，再渲染格子（顺序不可颠倒：后填会覆盖格子内容）
    var pr = OT.data.get(OT.state.pickYmd);
    var pot = pr ? ((pr.in && pr.out) ? D.otHours(pr.out, s.workEnd) : (Number(pr.ot) || 0)) : 0;
    OT.view.fill(root, {
      monthLabel: D.monthLabel(y, m),
      pickTitle: D.dateLabel(OT.state.pickYmd),
      pickSummary: pr
        ? ('上班 ' + (pr.in || '--:--') + ' · 下班 ' + (pr.out || '--:--') + ' · 加班 ' + D.fmtHours(pot) + ' · ' + rateText(pr.type))
        : '当日暂无记录，可点下方按钮补录'
    });

    var cells = D.monthMatrix(y, m).map(function (c) {
      var rec = OT.data.get(c.ymd);
      var ot = rec ? ((rec.in && rec.out) ? D.otHours(rec.out, s.workEnd) : (Number(rec.ot) || 0)) : 0;
      var has = !!(rec && (rec.in || rec.out || ot > 0));
      c.otText = ot > 0 ? String(ot) : '';
      c.hasDot = has;
      c.cls = (c.inMonth ? '' : 'is-out') + (c.weekend ? ' is-weekend' : '') +
        (c.today ? ' is-today' : '') + (c.ymd === OT.state.pickYmd ? ' is-picked' : '') + (has ? ' is-has' : '');
      return c;
    });
    OT.view.list(grid, tplRow, cells, function (node, c) {
      node.setAttribute('data-arg', c.ymd);
      OT.view.fill(node, c);
      c.cls.split(' ').forEach(function (k) { if (k) node.classList.add(k); });
    });
  }

  /* ---------- 统计 ---------- */
  function renderStat(root) {
    var s = settings();
    var isYear = OT.state.range === 'year';
    var range = isYear ? D.rangeOfYear(OT.state.y) : D.rangeOfMonth(OT.state.y, OT.state.m);
    var recs = OT.data.list(range);
    var sum = OT.stats.summary(recs, s);

    OT.view.fill(root, {
      s: sum,
      rangeText: isYear ? (OT.state.y + ' 年') : D.monthLabel(OT.state.y, OT.state.m),
      rangeMonth: isYear ? 'ot-btn-ghost' : 'ot-btn-primary',
      rangeYear: isYear ? 'ot-btn-primary' : 'ot-btn-ghost'
    });

    var bars = OT.stats.monthBars(allRecs(), s, OT.state.y, OT.state.m, 6).map(function (b) {
      b.isCurrent = b.isCurrent ? 'is-current' : '';
      return b;
    });
    OT.view.list(OT.view.slot(root, 'bars'), OT.view.slot(root, 'bar'), bars, function (n, b) { OT.view.fill(n, b); });

    var types = OT.stats.byType(recs, s);
    OT.view.list(OT.view.slot(root, 'types'), OT.view.slot(root, 'typeRow'), types, function (n, t) { OT.view.fill(n, t); });

    var rows = OT.stats.rows(recs, s);
    OT.view.list(OT.view.slot(root, 'rows'), OT.view.slot(root, 'row'), rows, function (n, r) {
      OT.view.all(n, '[data-arg]').forEach(function (b) { b.setAttribute('data-arg', r.ymd); });
      OT.view.fill(n, r);
    });
  }

  /* ---------- 设置 ---------- */
  function renderSet(root) {
    var s = settings();
    OT.view.fill(root, {
      adapterName: OT.data.adapterName === 'http' ? '服务器（离线缓存）' : '本机离线',
      recordCount: Object.keys(OT.data.all()).length,
      aboutText: OT.config.appName + ' · ' + OT.config.appSub,
      alphaText: Math.round(s.cardAlpha * 100) + '%',
      bgInfo: s.bgImage
        ? ('当前：自定义图片（约 ' + Math.round(s.bgImage.length / 1024) + ' KB，已存在本机）')
        : '当前：内置图片'
    });
    // 透明度数值实时回显
    function showAlpha(v) {
      var n = root.querySelector('[data-bind="alphaText"]');
      if (n) n.textContent = Math.round(v * 100) + '%';
    }
    OT.view.all(root, '[data-set]').forEach(function (n) {
      var key = n.getAttribute('data-set');
      var isPercent = n.getAttribute('data-percent') === '1';   // 滑动条按百分数显示，存储为 0~1
      function store() {
        var v = isPercent ? (Number(n.value) / 100) : (n.type === 'number' ? Number(n.value) : n.value);
        var res = OT.data.settings.set(key, v);
        if (res && res.all) s = res.all;
        if (key === 'cardAlpha') { showAlpha(s.cardAlpha); OT.mount.applySettings(); }
        OT.mount.refreshTop();
        return v;
      }
      if (n.type === 'range') {
        n.addEventListener('input', function () { store(); });          // 拖动中实时生效
        n.addEventListener('change', function () { store(); OT.bridge.toast('已保存'); });
      } else {
        n.addEventListener('change', function () { store(); OT.bridge.toast('已保存'); });
      }
      if (document.activeElement !== n) n.value = isPercent ? Math.round(s[key] * 100) : s[key];
    });
    // 两个开关
    function switchOn(name, on) {
      var el = OT.view.slot(root, name);
      if (el) el.classList.toggle('is-on', !!on);
    }
    switchOn('vswitch', s.vibrate);
    switchOn('gswitch', s.ghost);
    // 选图输入框
    var fi = OT.view.slot(root, 'bgFile');
    if (fi) {
      fi.addEventListener('change', function () { onBgFile(fi); });
    }
  }

  /* ---------- 记录编辑弹层 ---------- */
  function openEditor(ymd) {
    var s = settings();
    OT.state.editYmd = ymd || OT.state.pickYmd || D.today();
    OT.state.pickYmd = OT.state.editYmd;
    var vm = OT.punch.editorModel(OT.state.editYmd, s);
    OT.state.editType = vm.type;
    OT.modal.open(OT.tpl.editor, vm);
  }
  function refreshChips() {
    var t = OT.state.editType;
    OT.modal.fill({
      chipWeekday: t === 'weekday' ? 'is-on' : '',
      chipWeekend: t === 'weekend' ? 'is-on' : '',
      chipHoliday: t === 'holiday' ? 'is-on' : ''
    });
  }
  function saveEditor() {
    var root = OT.modal.root();
    if (!root) return;
    var v = OT.view.readValues(root);
    var res = OT.punch.saveEditor(OT.state.editYmd, {
      in: v['in'], out: v.out, ot: v.ot, type: OT.state.editType, note: v.note
    }, settings());
    if (!res.ok) { OT.bridge.toast(res.err || '保存失败'); return; }
    OT.modal.close();
    OT.bridge.vibrate(30);
    OT.bridge.toast(res.removed ? '已删除当日记录' : '已保存');
    OT.mount.render();
  }

  /* ---------- 背景图：选择 / 压缩 / 裁剪 ---------- */
  function pickBackground() {
    var inp = OT.appEl ? OT.appEl.querySelector('[data-ot="bgFile"]') : null;
    if (!inp) { OT.view.warn('设置页缺少 data-ot="bgFile" 选图输入框'); return; }
    inp.value = '';       // 允许重复选择同一张图
    inp.click();
  }
  // 等比缩放到长边 maxSide，输出 JPEG data URL（先铺白底，JPEG 不支持透明）
  function downscale(img, maxSide, q) {
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    if (!w || !h) return '';
    var s = Math.min(1, maxSide / Math.max(w, h));
    var cw = Math.max(1, Math.round(w * s)), ch = Math.max(1, Math.round(h * s));
    var cv = document.createElement('canvas');
    cv.width = cw; cv.height = ch;
    var g = cv.getContext('2d');
    g.fillStyle = '#FFFFFF';
    g.fillRect(0, 0, cw, ch);
    g.drawImage(img, 0, 0, cw, ch);
    try { return cv.toDataURL('image/jpeg', q); } catch (e) { return ''; }
  }
  function onBgFile(input) {
    var f = input.files && input.files[0];
    if (!f) return;
    if (!/^image\//.test(f.type || '')) { OT.bridge.toast('请选择图片文件'); return; }
    OT.bridge.toast('正在处理图片…');
    var fr = new FileReader();
    fr.onerror = function () { OT.bridge.toast('读取文件失败'); };
    fr.onload = function () {
      var img = new Image();
      img.onerror = function () { OT.bridge.toast('无法读取这张图片'); };
      img.onload = function () {
        var data = downscale(img, 1600, 0.86);
        if (!data) { OT.bridge.toast('图片处理失败，请换一张'); return; }
        var res = OT.data.settings.set('bgImage', data);
        if (res && res.ok === false) { OT.bridge.toast(res.err || '图片保存失败'); return; }
        OT.data.settings.set('bgX', 50);
        OT.data.settings.set('bgY', 50);
        OT.data.settings.set('bgZoom', 1);
        OT.mount.applySettings();
        OT.bridge.vibrate(30);
        OT.bridge.toast('背景已更新（' + Math.round(data.length / 1024) + ' KB），可拖动裁剪');
        openCrop();     // 选完直接进裁剪
      };
      img.src = String(fr.result || '');
    };
    fr.readAsDataURL(f);
  }

  function openCrop() {
    var s = settings();
    OT.state.crop = { x: Number(s.bgX), y: Number(s.bgY), zoom: Number(s.bgZoom) };
    OT.modal.open(OT.tpl.crop, { zoomText: Math.round(OT.state.crop.zoom * 100) + '%' }, true);
    var m = OT.modal.root();
    if (!m) return;
    var zs = OT.view.slot(m, 'cropZoom');
    if (zs) zs.value = String(Math.round(OT.state.crop.zoom * 100));
    bindCropDrag(m);
    applyCrop();
  }
  // 把裁剪中的位置/缩放实时写到 CSS 变量，弹层后面的真实背景同步变化
  function applyCrop() {
    var c = OT.state.crop;
    if (!c) return;
    var root = document.documentElement;
    root.style.setProperty('--bg-x', clamp(c.x, 0, 100) + '%');
    root.style.setProperty('--bg-y', clamp(c.y, 0, 100) + '%');
    root.style.setProperty('--bg-zoom', String(clamp(c.zoom, 1, 3)));
    var m = OT.modal.root();
    if (m) {
      var t = m.querySelector('[data-bind="zoomText"]');
      if (t) t.textContent = Math.round(c.zoom * 100) + '%';
    }
  }
  function bindCropDrag(m) {
    var frame = OT.view.slot(m, 'cropFrame');
    var zs = OT.view.slot(m, 'cropZoom');
    if (zs) {
      zs.addEventListener('input', function () {
        OT.state.crop.zoom = Number(zs.value) / 100;
        applyCrop();
      });
    }
    if (!frame) { OT.view.warn('裁剪弹层缺少 data-ot="cropFrame" 拖动区'); return; }
    var dragging = false, sx = 0, sy = 0, ox = 50, oy = 50;
    frame.addEventListener('pointerdown', function (e) {
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      ox = OT.state.crop.x; oy = OT.state.crop.y;
      try { if (frame.setPointerCapture) frame.setPointerCapture(e.pointerId); } catch (err) {}
    });
    frame.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var r = frame.getBoundingClientRect();
      var z = Math.max(1, OT.state.crop.zoom);
      // 手指右移 = 画面右移 → background-position 百分比要减小
      OT.state.crop.x = clamp(ox - (e.clientX - sx) / Math.max(1, r.width) * 100 / z, 0, 100);
      OT.state.crop.y = clamp(oy - (e.clientY - sy) / Math.max(1, r.height) * 100 / z, 0, 100);
      applyCrop();
      if (e.cancelable) e.preventDefault();
    });
    function end() { dragging = false; }
    frame.addEventListener('pointerup', end);
    frame.addEventListener('pointercancel', end);
    frame.addEventListener('lostpointercapture', end);
  }

  /* ---------- 导出 / 导入 ---------- */
  function exportJson() {
    var payload = {
      app: OT.config.appName,
      exportedAt: new Date().toISOString(),
      settings: settings(),
      records: OT.data.all()
    };
    var name = '加班日历备份_' + D.today() + '.json';
    var res = OT.bridge.exportFile(name, JSON.stringify(payload, null, 2), '加班日历');
    OT.bridge.toast(typeof res === 'string' ? res : ('已导出 ' + name));
  }
  function csvCell(s) {
    s = String(s == null ? '' : s);
    return /[",\r\n]/.test(s) ? ('"' + s.replace(/"/g, '""') + '"') : s;
  }
  function exportCsv() {
    var s = settings();
    var map = OT.data.all(), keys = Object.keys(map).sort();
    var lines = ['日期,星期,上班,下班,工作时长(h),加班时长(h),类型,加班倍率,折算工时(h),事由'];
    keys.forEach(function (k) {
      var r = OT.contract.normRec(map[k]);
      var ot = (r.in && r.out) ? D.otHours(r.out, s.workEnd) : (Number(r.ot) || 0);
      var rate = OT.contract.rateOf(r.type, s);
      lines.push([
        k, D.weekdayName(k), r.in, r.out,
        (r.in && r.out) ? D.workHours(r.in, r.out) : '',
        ot, OT.contract.TYPE_LABEL[r.type], rate, D.round1(ot * rate), csvCell(r.note)
      ].join(','));
    });
    var name = '加班日历记录_' + D.today() + '.csv';
    var res = OT.bridge.exportFile(name, '\ufeff' + lines.join('\r\n'), '加班日历');
    OT.bridge.toast(typeof res === 'string' ? res : ('已导出 ' + name));
  }
  function importData(replace) {
    var ta = OT.appEl ? OT.appEl.querySelector('[data-read="importText"]') : null;
    var txt = ta ? String(ta.value || '').trim() : '';
    if (!txt) { OT.bridge.toast('请先粘贴备份内容'); return; }
    var obj;
    try { obj = JSON.parse(txt); } catch (e) { OT.bridge.toast('不是合法的 JSON 内容'); return; }
    var recs = (obj && obj.records) ? obj.records : obj;
    if (!recs || typeof recs !== 'object') { OT.bridge.toast('备份里没有找到记录'); return; }
    var res = replace ? OT.data.replaceAll(recs) : OT.data.mergeAll(recs);
    if (replace && obj && obj.settings) OT.data.settings.replace(obj.settings);
    OT.mount.applySettings();
    OT.bridge.toast((replace ? '覆盖导入 ' : '合并导入 ') + res.count + ' 天记录');
    OT.mount.render();
  }

  /* ---------- 动作注册（视图里的 data-act 对应这里） ---------- */
  OT.actions.register('nav.go', function (a) { OT.mount.goto(a); });
  OT.actions.register('modal.close', function () {
    var wasCrop = !!OT.state.crop;      // 裁剪取消：还原成已保存的位置/缩放
    OT.state.crop = null;
    OT.modal.close();
    if (wasCrop) { OT.mount.applySettings(); OT.mount.render(); }
  });

  OT.actions.register('punch.primary', function () {
    var s = settings();
    var r = OT.punch.primary(D.today(), s);
    if (!r.ok) { OT.bridge.toast(r.msg); return; }
    if (s.vibrate) OT.bridge.vibrate(OT.config.vibrateMs);
    OT.bridge.toast(r.msg);
    OT.mount.render();
  });

  OT.actions.register('cal.prev', function () {
    var a = D.addMonths(OT.state.y, OT.state.m, -1);
    OT.state.y = a.y; OT.state.m = a.m; OT.mount.render();
  });
  OT.actions.register('cal.next', function () {
    var a = D.addMonths(OT.state.y, OT.state.m, 1);
    OT.state.y = a.y; OT.state.m = a.m; OT.mount.render();
  });
  OT.actions.register('cal.today', function () {
    var t = new Date();
    OT.state.y = t.getFullYear(); OT.state.m = t.getMonth() + 1;
    OT.state.pickYmd = D.today();
    OT.mount.render();
  });
  OT.actions.register('cal.pick', function (a) { openEditor(a); });

  OT.actions.register('editor.open', function (a) { openEditor(a || OT.state.pickYmd); });
  OT.actions.register('editor.type', function (a) { OT.state.editType = a; refreshChips(); });
  OT.actions.register('editor.save', saveEditor);
  OT.actions.register('editor.delete', function () {
    OT.data.remove(OT.state.editYmd);
    OT.modal.close();
    OT.bridge.toast('已删除 ' + OT.state.editYmd);
    OT.mount.render();
  });

  OT.actions.register('row.delete', function (a) {
    OT.data.remove(a);
    OT.bridge.toast('已删除 ' + a);
    OT.mount.render();
  });
  OT.actions.register('stat.range', function (a) { OT.state.range = a; OT.mount.render(); });

  OT.actions.register('set.vibrate', function () {
    var next = !settings().vibrate;
    OT.data.settings.set('vibrate', next);
    if (next) OT.bridge.vibrate(40);
    OT.bridge.toast(next ? '已开启震动反馈' : '已关闭震动反馈');
    OT.mount.render();
  });
  OT.actions.register('set.ghost', function () {
    var next = !settings().ghost;
    OT.data.settings.set('ghost', next);
    OT.mount.applySettings();
    OT.bridge.vibrate(30);
    OT.bridge.toast(next ? '已开启「仅显示文字」，卡片底色与模糊已取消' : '已关闭「仅显示文字」');
    OT.mount.render();
  });

  OT.actions.register('bg.pick', pickBackground);
  OT.actions.register('bg.crop', function () { openCrop(); });
  OT.actions.register('bg.reset', function () {
    OT.data.settings.set('bgImage', '');
    OT.data.settings.set('bgX', 50);
    OT.data.settings.set('bgY', 50);
    OT.data.settings.set('bgZoom', 1);
    OT.mount.applySettings();
    OT.bridge.toast('已恢复内置背景图');
    OT.mount.render();
  });
  OT.actions.register('crop.apply', function () {
    var c = OT.state.crop || { x: 50, y: 50, zoom: 1 };
    OT.data.settings.set('bgX', c.x);
    OT.data.settings.set('bgY', c.y);
    OT.data.settings.set('bgZoom', c.zoom);
    OT.state.crop = null;
    OT.modal.close();
    OT.bridge.vibrate(30);
    OT.bridge.toast('背景已应用');
    OT.mount.applySettings();
    OT.mount.render();
  });
  OT.actions.register('crop.reset', function () {
    OT.state.crop = { x: 50, y: 50, zoom: 1 };
    var m = OT.modal.root();
    var zs = m ? OT.view.slot(m, 'cropZoom') : null;
    if (zs) zs.value = '100';
    applyCrop();
  });

  OT.actions.register('set.exportJson', exportJson);
  OT.actions.register('set.exportCsv', exportCsv);
  OT.actions.register('set.openFolder', function () { OT.bridge.openFolder('加班日历'); });
  OT.actions.register('set.importMerge', function () { importData(false); });
  OT.actions.register('set.importReplace', function () { importData(true); });
  OT.actions.register('set.clear', function () {
    OT.data.clear();
    OT.bridge.toast('已清空全部数据');
    OT.mount.render();
  });

  /* ---------- 暴露给绑定层 ---------- */
  OT.pages = { home: renderHome, cal: renderCal, stat: renderStat, set: renderSet };
})();
