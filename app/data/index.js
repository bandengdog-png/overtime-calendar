// ============================================================
// 数据层入口：按 config.storage 选择适配器，对外只暴露 OT.data
// 业务层（logic / bind）只认 OT.data.*，不关心底层是本地还是服务器
// ============================================================
OT.data = (function () {
  var a = (OT.config.storage === 'http' && OT.adapters.http) ? OT.adapters.http : OT.adapters.local;
  return {
    adapterName: a.name,
    get: function (ymd) { return a.get(ymd); },
    save: function (ymd, rec) { return a.save(ymd, rec); },
    remove: function (ymd) { return a.remove(ymd); },
    list: function (range) { return a.list(range); },
    all: function () { return a.all(); },
    replaceAll: function (map) { return a.replaceAll(map); },
    mergeAll: function (map) { return a.mergeAll(map); },
    clear: function () { return a.clear(); },
    settings: {
      all: function () { return a.settings.all(); },
      get: function (k) { return a.settings.get(k); },
      set: function (k, v) { return a.settings.set(k, v); },
      replace: function (o) { return a.settings.replace(o); }
    }
  };
})();
