// ============================================================
// 数据契约（接口定义 + 结构校验）—— 数据层与业务层之间的唯一约定
// 任何适配器（local / http）都必须实现同样的方法签名
// ============================================================
OT.contract = (function () {
  var REC_KEY = 'ot.records.v1';
  var SET_KEY = 'ot.settings.v1';
  var HM = /^([01]\d|2[0-3]):[0-5]\d$/;
  var TYPES = ['weekday', 'weekend', 'holiday'];
  var TYPE_LABEL = { weekday: '工作日', weekend: '周末', holiday: '节假日' };

  var recDefaults = { in: '', out: '', ot: 0, type: 'weekday', note: '', auto: true, ts: 0 };
  var setDefaults = {
    workStart: '09:00', workEnd: '18:00',
    rateWeekday: 1.5, rateWeekend: 2, rateHoliday: 3,
    vibrate: true,
    cardAlpha: 0.85,          // 卡片透明度（0.30 ~ 1.00，越小越透、背景越明显）
    ghost: false,             // true = 只留文字：卡片底色与模糊全部取消
    blur: 10,                 // 毛玻璃模糊强度（px）
    bgImage: '',              // 自定义背景图（压缩后的 data URL，空 = 用内置图）
    bgX: 50, bgY: 50,         // 背景图水平/垂直位置（百分比 0~100）
    bgZoom: 1,                // 背景图缩放（1 ~ 3）
    name: ''
  };

  function isHM(s) { return s === '' || s === null || s === undefined || HM.test(String(s)); }
  function normRec(r) {
    r = r || {};
    var o = {};
    for (var k in recDefaults) o[k] = (k in r) ? r[k] : recDefaults[k];
    o.in = isHM(o.in) ? String(o.in || '') : '';
    o.out = isHM(o.out) ? String(o.out || '') : '';
    o.ot = Math.max(0, Math.min(24, OT.datex.round1(o.ot)));
    o.type = TYPES.indexOf(o.type) >= 0 ? o.type : 'weekday';
    o.note = String(o.note == null ? '' : o.note).slice(0, 200);
    o.auto = !!o.auto;
    o.ts = Number(o.ts) || 0;
    return o;
  }
  function validate(r) {
    var rec = normRec(r);
    if (!isHM(rec.in)) return { ok: false, err: '上班时间格式应为 HH:MM' };
    if (!isHM(rec.out)) return { ok: false, err: '下班时间格式应为 HH:MM' };
    return { ok: true, rec: rec };
  }
  function normSet(s) {
    s = s || {};
    var o = {};
    for (var k in setDefaults) o[k] = (k in s && s[k] !== '' && s[k] !== null && s[k] !== undefined) ? s[k] : setDefaults[k];
    if (!isHM(o.workStart) || o.workStart === '') o.workStart = setDefaults.workStart;
    if (!isHM(o.workEnd) || o.workEnd === '') o.workEnd = setDefaults.workEnd;
    o.rateWeekday = Number(o.rateWeekday) || 0;
    o.rateWeekend = Number(o.rateWeekend) || 0;
    o.rateHoliday = Number(o.rateHoliday) || 0;
    o.vibrate = !!o.vibrate;
    // 卡片透明度：夹在 0.30 ~ 1.00；非法值（NaN / 0 / 负数）回落到默认值
    var ca = Number(o.cardAlpha);
    if (!isFinite(ca) || ca <= 0) ca = setDefaults.cardAlpha;
    o.cardAlpha = Math.min(1, Math.max(0.3, ca));
    o.ghost = !!o.ghost;
    var bl = Number(o.blur);
    if (!isFinite(bl) || bl < 0) bl = setDefaults.blur;
    o.blur = Math.min(24, bl);
    // 自定义背景图必须是 data URL，其它一律当作未设置
    o.bgImage = (typeof o.bgImage === 'string' && o.bgImage.slice(0, 5) === 'data:') ? o.bgImage : '';
    var bx = Number(o.bgX); if (!isFinite(bx)) bx = 50;
    var by = Number(o.bgY); if (!isFinite(by)) by = 50;
    var bz = Number(o.bgZoom); if (!isFinite(bz) || bz <= 0) bz = 1;
    o.bgX = Math.min(100, Math.max(0, bx));
    o.bgY = Math.min(100, Math.max(0, by));
    o.bgZoom = Math.min(3, Math.max(1, bz));
    o.name = String(o.name || '');
    return o;
  }
  function rateOf(type, set) {
    if (type === 'weekend') return Number(set.rateWeekend) || 0;
    if (type === 'holiday') return Number(set.rateHoliday) || 0;
    return Number(set.rateWeekday) || 0;
  }

  return {
    REC_KEY: REC_KEY, SET_KEY: SET_KEY, TYPES: TYPES, TYPE_LABEL: TYPE_LABEL,
    recDefaults: recDefaults, setDefaults: setDefaults,
    isHM: isHM, normRec: normRec, validate: validate, normSet: normSet, rateOf: rateOf
  };
})();
