// ============================================================
// 绑定层：data-act 事件委托 + 动作注册表
// 页面/逻辑不直接绑 DOM 事件，只注册「动作名 → 函数」，由视图用 data-act 触发
// ============================================================
OT.actions = (function () {
  var map = {};
  var bound = false;

  function register(name, fn) {
    if (map[name]) console.warn('[actions] 动作重复注册:', name);
    map[name] = fn;
  }
  function run(name, arg, el) {
    var fn = map[name];
    if (!fn) { console.warn('[actions] 未注册的动作:', name); OT.bridge.toast('未定义操作：' + name); return; }
    try { fn(arg, el); }
    catch (e) { console.error('[actions]', name, e); OT.bridge.toast('操作失败'); }
  }
  function bind(root) {
    if (bound) return;
    bound = true;
    root.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!t || !t.closest) return;
      var actEl = t.closest('[data-act]');
      if (!actEl) return;
      // 弹层内部点击：若动作节点在 data-stop 子树之外，则忽略（避免点内容误关弹层）
      var stop = t.closest('[data-stop]');
      if (stop && !stop.contains(actEl)) return;
      var name = actEl.getAttribute('data-act');
      var arg = actEl.getAttribute('data-arg') || '';
      var cf = actEl.getAttribute('data-confirm');
      if (cf && !window.confirm(cf)) return;
      run(name, arg, actEl);
    });
  }
  return { register: register, run: run, bind: bind, has: function (n) { return !!map[n]; } };
})();
