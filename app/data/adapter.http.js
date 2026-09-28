// ============================================================
// 数据适配器：HTTP / 服务端（预留，默认不启用）
// 采用「离线优先」策略：本地缓存即真相，网络只做后台同步，
// 因此方法签名与 local 适配器完全一致（同步返回），业务层无需改动。
// 启用方式：config.js 里 storage: 'http' 并填好 apiBase
// ============================================================
OT.adapters = OT.adapters || {};
OT.adapters.http = (function () {
  var cache = OT.adapters.local;   // 离线缓存复用本地适配器

  function base() { return String(OT.config.apiBase || '').replace(/\/+$/, ''); }

  return {
    name: 'http',
    _cache: cache,
    // ===== 与 local 完全一致的读写接口（全部走本地缓存，保证离线可用）=====
    get: cache.get,
    save: cache.save,
    remove: cache.remove,
    list: cache.list,
    all: cache.all,
    replaceAll: cache.replaceAll,
    mergeAll: cache.mergeAll,
    clear: cache.clear,
    settings: cache.settings,

    // ===== 后台同步（业务层不需要直接调用）=====
    // 推送本机全部记录到服务端；回调 {ok, err}
    push: function (cb) {
      if (!base()) { cb && cb({ ok: false, err: '未配置 apiBase' }); return; }
      try {
        fetch(base() + '/records', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cache.all())
        }).then(function (r) {
          cb && cb({ ok: r.ok, err: r.ok ? '' : ('HTTP ' + r.status) });
        }).catch(function (e) { cb && cb({ ok: false, err: String(e) }); });
      } catch (e) { cb && cb({ ok: false, err: String(e) }); }
    },
    // 从服务端拉取并合并到本机
    pull: function (cb) {
      if (!base()) { cb && cb({ ok: false, err: '未配置 apiBase' }); return; }
      try {
        fetch(base() + '/records')
          .then(function (r) { return r.json(); })
          .then(function (map) {
            var res = cache.mergeAll(map || {});
            cb && cb({ ok: true, count: res.count });
          })
          .catch(function (e) { cb && cb({ ok: false, err: String(e) }); });
      } catch (e) { cb && cb({ ok: false, err: String(e) }); }
    }
  };
})();
