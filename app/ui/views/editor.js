// ============================================================
// 视图模板：记录编辑弹层（补录 / 修改 / 删除）
// 【钩子说明】data-read = 可读可写的字段名（保存时按名字取值）
// ============================================================
OT.tpl.editor = `
<div class="ot-modal-title" data-bind="title">编辑记录</div>
<div class="ot-mini" data-bind="statusText"></div>

<div class="ot-modal-bd">
  <div class="ot-row">
    <label class="ot-field"><span class="ot-field-label">上班打卡</span>
      <input class="ot-input" type="time" data-read="in"></label>
    <label class="ot-field"><span class="ot-field-label">下班打卡</span>
      <input class="ot-input" type="time" data-read="out"></label>
  </div>

  <div class="ot-row">
    <label class="ot-field"><span class="ot-field-label">加班时长 (h)</span>
      <input class="ot-input" type="number" step="0.1" min="0" max="24" data-read="ot" placeholder="留空=自动算"></label>
    <div class="ot-field">
      <span class="ot-field-label">当日工作时长</span>
      <span class="ot-strong ot-num" data-bind="workText" style="padding:9px 0">--</span>
    </div>
  </div>

  <div class="ot-field">
    <span class="ot-field-label">加班类型</span>
    <div class="ot-row">
      <button class="ot-chip" data-act="editor.type" data-arg="weekday" data-bind-class="chipWeekday">工作日</button>
      <button class="ot-chip" data-act="editor.type" data-arg="weekend" data-bind-class="chipWeekend">周末</button>
      <button class="ot-chip" data-act="editor.type" data-arg="holiday" data-bind-class="chipHoliday">节假日</button>
    </div>
  </div>

  <label class="ot-field"><span class="ot-field-label">加班事由</span>
    <input class="ot-input" data-read="note" placeholder="例如：赶项目上线"></label>

  <div class="ot-mini">时间与事由都留空后保存，即删除当日记录</div>
</div>

<div class="ot-modal-ft">
  <button class="ot-btn ot-btn-ghost" data-act="modal.close">取消</button>
  <button class="ot-btn ot-btn-danger" data-act="editor.delete" data-confirm="删除当日记录？">删除</button>
  <button class="ot-btn ot-btn-primary" data-act="editor.save">保存</button>
</div>`;
