// ============================================================
// 视图模板：统计页
// 【must keep】data-ot="bars" / "types" / "rows" 容器与对应 row 模板，动作 stat.range / row.delete / editor.open
// ============================================================
OT.tpl.stat = `
<div class="ot-page">
  <div class="ot-pagebody">

    <div class="ot-row">
      <button class="ot-btn ot-btn-sm" data-act="stat.range" data-arg="month" data-bind-class="rangeMonth">本月</button>
      <button class="ot-btn ot-btn-sm" data-act="stat.range" data-arg="year" data-bind-class="rangeYear">本年</button>
      <span class="ot-grow"></span>
      <span class="ot-sub" data-bind="rangeText">--</span>
    </div>

    <div class="ot-stats">
      <div class="ot-stat"><div class="ot-stat-num ot-num" data-bind="s.hoursText">0h</div><div class="ot-stat-lab">加班总时长</div></div>
      <div class="ot-stat"><div class="ot-stat-num ot-num" data-bind="s.daysText">0 天</div><div class="ot-stat-lab">加班天数</div></div>
      <div class="ot-stat"><div class="ot-stat-num ot-num" data-bind="s.weightedText">0h</div><div class="ot-stat-lab">折算工时</div></div>
      <div class="ot-stat"><div class="ot-stat-num ot-num" data-bind="s.maxText">0h</div><div class="ot-stat-lab">单日最高</div></div>
    </div>

    <div class="ot-card">
      <div class="ot-card-title">近 6 个月加班</div>
      <div class="ot-bars" data-ot="bars"></div>
      <template data-ot="bar">
        <div class="ot-bar-col">
          <div class="ot-bar-val" data-bind="hoursText"></div>
          <div class="ot-bar" data-bind-class="isCurrent" data-bind-style="height=heightPct%"></div>
          <div class="ot-bar-lab" data-bind="label"></div>
        </div>
      </template>
    </div>

    <div class="ot-card">
      <div class="ot-card-title">类型分布</div>
      <div class="ot-col" data-ot="types"></div>
      <template data-ot="typeRow">
        <div class="ot-typerow">
          <span class="ot-type-name" data-bind="label"></span>
          <div class="ot-bar-bg"><div class="ot-bar-fill" data-bind-style="width=pct%"></div></div>
          <span class="ot-type-val ot-num" data-bind="hoursText"></span>
        </div>
      </template>
    </div>

    <div class="ot-card">
      <div class="ot-card-title">明细</div>
      <div data-ot="rows"></div>
      <template data-ot="row">
        <div class="ot-list-item">
          <div class="ot-between">
            <span class="ot-strong ot-num" data-bind="dateText"></span>
            <span class="ot-row">
              <button class="ot-btn ot-btn-soft ot-btn-sm" data-act="editor.open" data-arg="">编辑</button>
              <button class="ot-btn ot-btn-ghost ot-btn-sm" data-act="row.delete" data-arg="">删除</button>
            </span>
          </div>
          <div class="ot-li-sub">
            <span data-bind="weekText"></span> · <span class="ot-num" data-bind="timeText"></span>
            · 加班 <span class="ot-num" data-bind="otText"></span> · <span data-bind="typeLabel"></span>
          </div>
          <div class="ot-li-sub" data-bind="note" data-bind-if="hasNote"></div>
        </div>
      </template>
    </div>

  </div>
</div>`;
