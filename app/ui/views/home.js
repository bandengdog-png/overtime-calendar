// ============================================================
// 视图模板：今日页（核心：一键打卡）
// 【设计师改动区】纯 HTML，可直接替换为设计稿结构
// 【必须保留】data-bind / data-act / data-bind-class / data-bind-if 钩子
// ============================================================
OT.tpl.home = `
<div class="ot-page">
  <div class="ot-pagebody">

    <div class="ot-hero">
      <div class="ot-hero-date" data-bind="dateLabel">--</div>

      <button class="ot-punch" data-act="punch.primary" data-bind-class="btnClass">
        <b data-bind="btnText">上班打卡</b>
        <small data-bind="btnSub">点一下记录当前时间</small>
      </button>

      <div class="ot-hero-times">
        <span>上班 <b class="ot-num" data-bind="inText">--:--</b></span>
        <span>下班 <b class="ot-num" data-bind="outText">--:--</b></span>
        <span>加班 <b class="ot-num" data-bind="otText">--</b></span>
      </div>

      <div class="ot-row">
        <button class="ot-btn ot-btn-ghost ot-btn-sm" data-act="editor.open">修改 / 补录</button>
        <button class="ot-btn ot-btn-soft ot-btn-sm" data-act="nav.go" data-arg="cal">去日历看看</button>
      </div>
    </div>

    <div class="ot-card">
      <div class="ot-card-title">今日详情</div>
      <div class="ot-between"><span class="ot-sub">加班类型</span><span class="ot-strong" data-bind="typeLabel">--</span></div>
      <div class="ot-between" style="margin-top:6px"><span class="ot-sub">当日工作时长</span><span class="ot-strong ot-num" data-bind="workText">--</span></div>
      <div class="ot-between" style="margin-top:6px" data-bind-if="hasNote">
        <span class="ot-sub">加班事由</span><span class="ot-strong" data-bind="note"></span>
      </div>
    </div>

    <div class="ot-card">
      <div class="ot-card-title">本月小结</div>
      <div class="ot-strong" data-bind="monthSummary">--</div>
      <div class="ot-mini" style="margin-top:4px">数据只存本机，可在「设置」里导出备份</div>
    </div>

  </div>
</div>`;
