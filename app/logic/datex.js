// ============================================================
// 日期与时间工具（纯逻辑，零 DOM 依赖）
// 所有日期字符串统一为 'YYYY-MM-DD'，时间统一为 'HH:MM'
// ============================================================
OT.datex = (function () {
  var WD = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function parseYmd(s) {
    var p = String(s || '').split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function today() { return ymd(new Date()); }
  function nowHM() { var d = new Date(); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
  function round1(v) { return Math.round(Number(v) * 10) / 10; }

  function hmToMin(s) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '').trim());
    if (!m) return null;
    var v = Number(m[1]) * 60 + Number(m[2]);
    return v;
  }
  function minToHM(v) {
    v = Math.max(0, Math.round(Number(v) || 0));
    return pad2(Math.floor(v / 60) % 24) + ':' + pad2(v % 60);
  }
  // 加班时长（小时，1 位小数）：下班时间 − 基准下班时间
  // 下班早于基准时：间隔超过 12 小时视为跨零点（次日），否则视为正常范围（如早退）不产生加班
  function otHours(outHM, workEndHM) {
    var o = hmToMin(outHM), e = hmToMin(workEndHM);
    if (o === null || e === null) return 0;
    var d = o - e;
    if (d < 0) {
      if (-d > 12 * 60) d += 24 * 60;
      else return 0;
    }
    return round1(d / 60);
  }
  // 当日工作时长（小时）：下班 − 上班（同样按 12 小时界限判断跨零点）
  function workHours(inHM, outHM) {
    var a = hmToMin(inHM), b = hmToMin(outHM);
    if (a === null || b === null) return 0;
    var d = b - a;
    if (d < 0) {
      if (-d > 12 * 60) d += 24 * 60;
      else return 0;
    }
    return round1(d / 60);
  }

  // 0 = 周一 … 6 = 周日（周一为一周第一天）
  function wdIndex(ymdStr) { return (parseYmd(ymdStr).getDay() + 6) % 7; }
  function weekdayName(ymdStr) { return WD[wdIndex(ymdStr)]; }
  function isWeekend(ymdStr) { return wdIndex(ymdStr) >= 5; }
  function dateLabel(ymdStr) {
    var p = String(ymdStr).split('-');
    return p[1] + '月' + p[2] + '日 ' + weekdayName(ymdStr);
  }
  function shortMd(ymdStr) { return String(ymdStr).slice(5); }

  function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }
  function monthLabel(y, m) { return y + '年' + m + '月'; }
  // 6×7 月历矩阵（周一起始，固定 42 格）
  function monthMatrix(y, m) {
    var first = new Date(y, m - 1, 1);
    var lead = (first.getDay() + 6) % 7;
    var start = new Date(y, m - 1, 1 - lead);
    var t = today(), out = [];
    for (var i = 0; i < 42; i++) {
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      var s = ymd(d);
      out.push({
        ymd: s,
        day: d.getDate(),
        inMonth: (d.getMonth() === m - 1 && d.getFullYear() === y),
        weekend: (d.getDay() === 0 || d.getDay() === 6),
        today: (s === t)
      });
    }
    return out;
  }
  function addMonths(y, m, delta) {
    var d = new Date(y, m - 1 + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() + 1 };
  }
  function rangeOfMonth(y, m) {
    return { from: y + '-' + pad2(m) + '-01', to: y + '-' + pad2(m) + '-' + pad2(daysInMonth(y, m)) };
  }
  function rangeOfYear(y) { return { from: y + '-01-01', to: y + '-12-31' }; }
  function lastNMonths(y, m, n) {
    var out = [];
    for (var i = n - 1; i >= 0; i--) {
      var a = addMonths(y, m, -i);
      out.push({ y: a.y, m: a.m, label: a.m + '月' });
    }
    return out;
  }
  function fmtHours(v) {
    var n = round1(v);
    return n > 0 ? (n + 'h') : '0h';
  }

  return {
    pad2: pad2, ymd: ymd, parseYmd: parseYmd, today: today, nowHM: nowHM, round1: round1,
    hmToMin: hmToMin, minToHM: minToHM, otHours: otHours, workHours: workHours,
    wdIndex: wdIndex, weekdayName: weekdayName, isWeekend: isWeekend,
    dateLabel: dateLabel, shortMd: shortMd,
    daysInMonth: daysInMonth, monthLabel: monthLabel, monthMatrix: monthMatrix,
    addMonths: addMonths, rangeOfMonth: rangeOfMonth, rangeOfYear: rangeOfYear,
    lastNMonths: lastNMonths, fmtHours: fmtHours
  };
})();
