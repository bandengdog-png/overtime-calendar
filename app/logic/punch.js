// ============================================================
// 打卡业务（纯逻辑，零 DOM 依赖）
// 状态机：none（未打卡）→ in（已上班未下班）→ done（当日完成）
// ============================================================
OT.punch = (function () {
  var D = OT.datex, C = OT.contract;

  function statusOf(rec) {
    if (!rec) return 'none';
    if (rec.in && rec.out) return 'done';
    if (rec.in) return 'in';                     // 已上班未下班
    if (rec.out) return 'done';                  // 只补录了下班时间
    if (Number(rec.ot) > 0) return 'done';       // 只补录了加班时长
    return 'none';                               // 只有备注或空记录，仍可打卡
  }
  // 类型自动判定：周六/日 → weekend，其余 → weekday（节假日需手动选）
  function autoType(ymdStr) { return D.isWeekend(ymdStr) ? 'weekend' : 'weekday'; }
  // 自动加班时长：有上下班时间时按基准下班时间算，否则保留原值
  function computeOt(rec, settings) {
    if (rec && rec.in && rec.out) return D.otHours(rec.out, settings.workEnd);
    return rec ? Number(rec.ot) || 0 : 0;
  }

  // 一键打卡：返回 { ok, action, time, msg }
  function primary(ymdStr, settings) {
    var stored = OT.data.get(ymdStr);
    var st = statusOf(stored);
    var rec = stored || C.normRec({});
    if (st === 'none') {
      rec.in = D.nowHM();
      rec.type = autoType(ymdStr);
      rec.ts = Date.now();
      var r1 = OT.data.save(ymdStr, rec);
      if (!r1.ok) return { ok: false, msg: r1.err || '保存失败' };
      return { ok: true, action: 'in', time: rec.in, msg: '上班打卡 ' + rec.in };
    }
    if (st === 'in') {
      rec.out = D.nowHM();
      rec.ot = computeOt(rec, settings);
      rec.auto = true;
      rec.ts = Date.now();
      var r2 = OT.data.save(ymdStr, rec);
      if (!r2.ok) return { ok: false, msg: r2.err || '保存失败' };
      return { ok: true, action: 'out', time: rec.out, msg: '下班打卡 ' + rec.out + ' · 加班 ' + D.fmtHours(rec.ot) };
    }
    return { ok: false, msg: '今日已完成，点「修改 / 补录」可调整' };
  }

  // 首页打卡大卡的视图数据（由绑定层填充到视图）
  function viewModel(ymdStr, settings) {
    var rec = OT.data.get(ymdStr);
    var st = statusOf(rec);
    var btnText = st === 'none' ? '上班打卡' : (st === 'in' ? '下班打卡' : '今日已完成');
    var btnSub = st === 'none' ? '点一下记录当前时间'
      : (st === 'in' ? ('上班 ' + rec.in + ' 已打') : '点「修改」可补录');
    var ot = rec ? computeOt(rec, settings) : 0;
    return {
      dateLabel: D.dateLabel(ymdStr),
      btnText: btnText,
      btnSub: btnSub,
      btnClass: 'is-' + st,
      status: st,
      inText: rec && rec.in ? rec.in : '--:--',
      outText: rec && rec.out ? rec.out : '--:--',
      otText: rec ? D.fmtHours(ot) : '--',
      workText: (rec && rec.in && rec.out) ? D.fmtHours(D.workHours(rec.in, rec.out)) : '--',
      type: rec ? rec.type : autoType(ymdStr),
      typeLabel: C.TYPE_LABEL[rec ? rec.type : autoType(ymdStr)],
      note: rec ? rec.note : '',
      hasNote: !!(rec && rec.note),
      hasRec: !!rec
    };
  }

  // 弹层保存：form = { in, out, ot, type, note }
  function saveEditor(ymdStr, form, settings) {
    var inHM = String(form.in || '').trim();
    var outHM = String(form.out || '').trim();
    var note = String(form.note || '').trim();
    var type = C.TYPES.indexOf(form.type) >= 0 ? form.type : autoType(ymdStr);
    var manualOt = String(form.ot == null ? '' : form.ot).trim();

    if (!C.isHM(inHM)) return { ok: false, err: '上班时间格式应为 HH:MM' };
    if (!C.isHM(outHM)) return { ok: false, err: '下班时间格式应为 HH:MM' };

    // 时间与时长都为空 → 视为删除该日记录
    if (!inHM && !outHM && manualOt === '' && !note) {
      OT.data.remove(ymdStr);
      return { ok: true, removed: true };
    }
    var rec = OT.data.get(ymdStr) || C.normRec({});
    rec.in = inHM;
    rec.out = outHM;
    rec.type = type;
    rec.note = note;
    var autoOt = (inHM && outHM) ? D.otHours(outHM, settings.workEnd) : 0;
    if (manualOt === '') {
      rec.ot = autoOt;
      rec.auto = true;
    } else {
      var v = D.round1(manualOt);
      rec.ot = Math.max(0, Math.min(24, v));
      rec.auto = (Math.abs(rec.ot - autoOt) < 0.05);   // 与自动值一致则仍视为自动
    }
    rec.ts = Date.now();
    return OT.data.save(ymdStr, rec);
  }

  // 弹层视图数据
  function editorModel(ymdStr, settings) {
    var stored = OT.data.get(ymdStr);
    var rec = stored || C.normRec({});
    if (!stored) rec.type = autoType(ymdStr);   // 新记录：默认按星期判定工作日 / 周末
    var st = statusOf(stored);
    var ot = (rec.in && rec.out) ? D.otHours(rec.out, settings.workEnd) : (Number(rec.ot) || 0);
    var chips = {};
    C.TYPES.forEach(function (t) { chips[t] = (t === rec.type) ? 'is-on' : ''; });
    return {
      title: '编辑 ' + D.dateLabel(ymdStr),
      ymd: ymdStr,
      in: rec.in,
      out: rec.out,
      ot: ot ? String(ot) : '',
      note: rec.note,
      type: rec.type,
      statusText: st === 'none' ? '当日暂无记录' : (st === 'in' ? '已打上班卡，尚未打下班卡' : '当日已完成'),
      workText: (rec.in && rec.out) ? D.fmtHours(D.workHours(rec.in, rec.out)) : '--',
      chipWeekday: chips.weekday,
      chipWeekend: chips.weekend,
      chipHoliday: chips.holiday,
      hasRec: st !== 'none'
    };
  }

  return {
    statusOf: statusOf, autoType: autoType, computeOt: computeOt,
    primary: primary, viewModel: viewModel, saveEditor: saveEditor, editorModel: editorModel
  };
})();
