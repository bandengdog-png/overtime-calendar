// ============================================================
// 统计（纯逻辑，零 DOM 依赖）
// ============================================================
OT.stats = (function () {
  var D = OT.datex, C = OT.contract;

  // 汇总：加班天数 / 总时长 / 折算工时 / 单日最高
  function summary(recs, settings) {
    var days = 0, hours = 0, weighted = 0, max = 0;
    (recs || []).forEach(function (r) {
      var ot = r.in && r.out ? D.otHours(r.out, settings.workEnd) : (Number(r.ot) || 0);
      if (ot > 0) days++;
      hours += ot;
      weighted += ot * C.rateOf(r.type, settings);
      if (ot > max) max = ot;
    });
    hours = D.round1(hours);
    weighted = D.round1(weighted);
    return {
      days: days,
      hours: hours,
      weighted: weighted,
      max: D.round1(max),
      hoursText: D.fmtHours(hours),
      weightedText: D.fmtHours(weighted),
      maxText: D.fmtHours(max),
      daysText: days + ' 天',
      avgText: days > 0 ? D.fmtHours(D.round1(hours / days)) : '0h'
    };
  }

  // 按类型分布（工作日 / 周末 / 节假日）
  function byType(recs, settings) {
    var acc = { weekday: { days: 0, hours: 0 }, weekend: { days: 0, hours: 0 }, holiday: { days: 0, hours: 0 } };
    (recs || []).forEach(function (r) {
      var ot = r.in && r.out ? D.otHours(r.out, settings.workEnd) : (Number(r.ot) || 0);
      var t = acc[r.type] ? r.type : 'weekday';
      if (ot > 0) acc[t].days++;
      acc[t].hours += ot;
    });
    var total = acc.weekday.hours + acc.weekend.hours + acc.holiday.hours;
    return C.TYPES.map(function (t) {
      var h = D.round1(acc[t].hours);
      return {
        type: t,
        label: C.TYPE_LABEL[t],
        days: acc[t].days,
        hours: h,
        hoursText: D.fmtHours(h),
        daysText: acc[t].days + ' 天',
        pct: total > 0 ? Math.round(h / total * 100) : 0
      };
    });
  }

  // 近 n 个月柱状数据（含当前月）
  function monthBars(recs, settings, y, m, n) {
    var months = D.lastNMonths(y, m, n || 6);
    var map = {};
    months.forEach(function (mo) { map[mo.y + '-' + mo.m] = { label: mo.label, hours: 0 }; });
    (recs || []).forEach(function (r) {
      var key = Number(r.ymd.slice(0, 4)) + '-' + Number(r.ymd.slice(5, 7));
      if (!map[key]) return;
      var ot = r.in && r.out ? D.otHours(r.out, settings.workEnd) : (Number(r.ot) || 0);
      map[key].hours += ot;
    });
    var bars = months.map(function (mo) {
      var it = map[mo.y + '-' + mo.m];
      it.hours = D.round1(it.hours);
      return it;
    });
    var max = 0;
    bars.forEach(function (b) { if (b.hours > max) max = b.hours; });
    bars.forEach(function (b) {
      b.hoursText = D.fmtHours(b.hours);
      b.maxText = D.fmtHours(max);
      b.heightPct = max > 0 ? Math.max(4, Math.round(b.hours / max * 100)) : 4;
      b.isCurrent = (b.label === (m + '月'));
    });
    return bars;
  }

  // 明细行（按日期倒序）
  function rows(recs, settings) {
    var out = (recs || []).slice();
    out.sort(function (a, b) { return a.ymd < b.ymd ? 1 : -1; });
    return out.map(function (r) {
      var ot = r.in && r.out ? D.otHours(r.out, settings.workEnd) : (Number(r.ot) || 0);
      return {
        ymd: r.ymd,
        dateText: D.shortMd(r.ymd),
        weekText: D.weekdayName(r.ymd),
        timeText: (r.in || '--:--') + ' → ' + (r.out || '--:--'),
        otText: D.fmtHours(ot),
        workText: (r.in && r.out) ? D.fmtHours(D.workHours(r.in, r.out)) : '--',
        typeLabel: C.TYPE_LABEL[r.type] || '工作日',
        note: r.note || '',
        hasNote: !!r.note
      };
    });
  }

  // 月度小结文案（首页/顶栏用）
  function monthSummaryText(y, m, settings) {
    var recs = OT.data.list(D.rangeOfMonth(y, m));
    var s = summary(recs, settings);
    return '加班 ' + s.days + ' 天 · 合计 ' + s.hoursText;
  }

  return { summary: summary, byType: byType, monthBars: monthBars, rows: rows, monthSummaryText: monthSummaryText };
})();
