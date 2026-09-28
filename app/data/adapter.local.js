// ============================================================
// 数据适配器：localStorage（默认，纯离线）
// 实现 OT.contract 约定的全部方法签名
// ============================================================
OT.adapters = OT.adapters || {};
OT.adapters.local = (function () {
  var C = OT.contract;

  function readMap() {
    try {
      var raw = localStorage.getItem(C.REC_KEY);
      var o = raw ? JSON.parse(raw) : {};
      return (o && typeof o === 'object') ? o : {};
    } catch (e) { return {}; }
  }
  function writeMap(m) {
    try { localStorage.setItem(C.REC_KEY, JSON.stringify(m)); return true; }
    catch (e) { console.error('[data] 写入失败', e); return false; }
  }
  function readSet() {
    try {
      var raw = localStorage.getItem(C.SET_KEY);
      return C.normSet(raw ? JSON.parse(raw) : {});
    } catch (e) { return C.normSet({}); }
  }
  function writeSet(s) {
    try { localStorage.setItem(C.SET_KEY, JSON.stringify(C.normSet(s))); return true; }
    catch (e) { console.error('[data] 设置写入失败', e); return false; }
  }

  return {
    name: 'local',
    get: function (ymd) {
      var m = readMap();
      return m[ymd] ? C.normRec(m[ymd]) : null;
    },
    save: function (ymd, rec) {
      var v = C.validate(rec);
      if (!v.ok) return v;
      var m = readMap();
      m[ymd] = v.rec;
      if (!writeMap(m)) return { ok: false, err: '本地存储写入失败' };
      return { ok: true, rec: v.rec };
    },
    remove: function (ymd) {
      var m = readMap();
      if (m[ymd]) { delete m[ymd]; writeMap(m); }
      return { ok: true };
    },
    list: function (range) {
      var m = readMap(), from = range && range.from, to = range && range.to, out = [];
      for (var k in m) {
        if (from && k < from) continue;
        if (to && k > to) continue;
        var r = C.normRec(m[k]);
        r.ymd = k;
        out.push(r);
      }
      out.sort(function (a, b) { return a.ymd < b.ymd ? -1 : 1; });
      return out;
    },
    all: function () {
      var m = readMap(), out = {};
      for (var k in m) out[k] = C.normRec(m[k]);
      return out;
    },
    replaceAll: function (map) {
      var out = {}, n = 0;
      for (var k in (map || {})) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) continue;
        var v = C.validate(map[k]);
        if (v.ok) { out[k] = v.rec; n++; }
      }
      writeMap(out);
      return { ok: true, count: n };
    },
    mergeAll: function (map) {
      var cur = readMap(), n = 0;
      for (var k in (map || {})) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) continue;
        var v = C.validate(map[k]);
        if (v.ok) { cur[k] = v.rec; n++; }
      }
      writeMap(cur);
      return { ok: true, count: n };
    },
    clear: function () { writeMap({}); return { ok: true }; },
    settings: {
      all: readSet,
      get: function (k) { return readSet()[k]; },
      set: function (k, v) {
        var s = readSet();
        s[k] = v;
        var ok = writeSet(s);
        return { ok: ok, all: readSet(), err: ok ? '' : '本地存储写入失败（可能是图片过大）' };
      },
      replace: function (obj) { writeSet(obj); return { ok: true, all: readSet() }; }
    }
  };
})();
