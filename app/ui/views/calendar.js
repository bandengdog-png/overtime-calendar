// ============================================================
// 视图模板：日历页（月视图 + 点击补录）
// 【must keep】data-ot="grid" 容器、data-ot="row" 单元格模板、cal.pick / cal.prev / cal.next / cal.today 动作
// ============================================================
OT.tpl.cal = `
<div class="ot-page">
  <div class="ot-pagebody">

    <div class="ot-card">
      <div class="ot-cal-head">
        <button class="ot-btn ot-btn-ghost ot-btn-sm" data-act="cal.prev">‹ 上月</button>
        <div class="ot-cal-month" data-bind="monthLabel">--</div>
        <button class="ot-btn ot-btn-ghost ot-btn-sm" data-act="cal.next">下月 ›</button>
      </div>
      <div class="ot-row" style="justify-content:center;margin-top:8px">
        <button class="ot-btn ot-btn-soft ot-btn-sm" data-act="cal.today">回到本月</button>
      </div>
    </div>

    <div class="ot-card">
      <div class="ot-cal-week">
        <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span>
      </div>
      <div class="ot-cal-grid" data-ot="grid"></div>
      <div class="ot-legend" style="margin-top:10px">
        <span><i></i>已打卡</span>
        <span>格内数字 = 加班时长</span>
      </div>
      <template data-ot="row">
        <button class="ot-cell" data-act="cal.pick" data-arg="">
          <span class="ot-cell-d" data-bind="day"></span>
          <em class="ot-cell-ot" data-bind="otText"></em>
          <i class="ot-cell-dot" data-bind-if="hasDot"></i>
        </button>
      </template>
    </div>

    <div class="ot-card">
      <div class="ot-card-title" data-bind="pickTitle">选中日期</div>
      <div class="ot-sub" data-bind="pickSummary">点上方任意日期即可查看 / 补录</div>
      <button class="ot-btn ot-btn-primary ot-btn-block" style="margin-top:10px" data-act="editor.open">补录 / 修改该日</button>
    </div>

  </div>
</div>`;
