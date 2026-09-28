// ============================================================
// 视图模板：设置页
// 【钩子说明】data-set = 改动即保存的设置项；data-read = 只读取不自动保存（导入框）
//            data-ot="bgFile" 隐藏的选图输入框（安卓端由壳弹出的系统选图）
// ============================================================
OT.tpl.set = `
<div class="ot-page">
  <div class="ot-pagebody">

    <div class="ot-card">
      <div class="ot-card-title">工作时间基准</div>
      <div class="ot-row">
        <label class="ot-field"><span class="ot-field-label">上班时间</span>
          <input class="ot-input" type="time" data-set="workStart"></label>
        <label class="ot-field"><span class="ot-field-label">下班时间</span>
          <input class="ot-input" type="time" data-set="workEnd"></label>
      </div>
      <div class="ot-mini" style="margin-top:8px">加班时长 = 下班打卡时间 − 下班基准时间（跨零点自动按次日算）</div>
    </div>

    <div class="ot-card">
      <div class="ot-card-title">加班倍率</div>
      <div class="ot-row">
        <label class="ot-field"><span class="ot-field-label">工作日</span>
          <input class="ot-input" type="number" step="0.5" min="0" data-set="rateWeekday"></label>
        <label class="ot-field"><span class="ot-field-label">周末</span>
          <input class="ot-input" type="number" step="0.5" min="0" data-set="rateWeekend"></label>
        <label class="ot-field"><span class="ot-field-label">节假日</span>
          <input class="ot-input" type="number" step="0.5" min="0" data-set="rateHoliday"></label>
      </div>
      <div class="ot-mini" style="margin-top:8px">折算工时 = 加班时长 × 倍率</div>
    </div>

    <div class="ot-card">
      <div class="ot-card-title">界面透明度</div>
      <div class="ot-between">
        <span class="ot-sub">卡片透明度（越小背景越明显）</span>
        <span class="ot-strong ot-num" data-bind="alphaText">85%</span>
      </div>
      <input class="ot-range" type="range" min="30" max="100" step="5"
             data-set="cardAlpha" data-percent="1" data-ot="alphaRange">
      <div class="ot-row" style="justify-content:space-between;margin-top:4px">
        <span class="ot-mini">更透</span>
        <span class="ot-mini">更实</span>
      </div>
      <div class="ot-between" style="margin-top:10px">
        <span class="ot-sub">仅显示文字（取消卡片底色与模糊）</span>
        <button class="ot-switch" data-act="set.ghost" data-ot="gswitch"><i></i></button>
      </div>
      <div class="ot-mini" style="margin-top:6px">开启后卡片完全透明、只保留文字，背景图最清楚</div>
    </div>

    <div class="ot-card">
      <div class="ot-card-title">背景图</div>
      <div class="ot-sub" data-bind="bgInfo">当前：内置图片</div>
      <input type="file" accept="image/*" data-ot="bgFile" style="display:none">
      <div class="ot-row" style="margin-top:10px">
        <button class="ot-btn ot-btn-soft ot-btn-block" data-act="bg.pick">选择本地图片</button>
        <button class="ot-btn ot-btn-soft ot-btn-block" data-act="bg.crop">自定义裁剪</button>
      </div>
      <div class="ot-row" style="margin-top:8px">
        <button class="ot-btn ot-btn-ghost ot-btn-block" data-act="bg.reset">恢复内置背景</button>
      </div>
      <div class="ot-mini" style="margin-top:8px">
        上传的图片会自动压缩到长边 1600px 后存在本机，不联网；
        裁剪页可拖动画面、滑块缩放，所见即手机上的效果
      </div>
    </div>

    <div class="ot-card">
      <div class="ot-between">
        <span>打卡震动反馈</span>
        <button class="ot-switch" data-act="set.vibrate" data-ot="vswitch"><i></i></button>
      </div>
    </div>

    <div class="ot-card">
      <div class="ot-card-title">数据备份</div>
      <div class="ot-row">
        <button class="ot-btn ot-btn-soft ot-btn-block" data-act="set.exportJson">导出 JSON</button>
        <button class="ot-btn ot-btn-soft ot-btn-block" data-act="set.exportCsv">导出 CSV</button>
      </div>
      <div class="ot-row" style="margin-top:8px">
        <button class="ot-btn ot-btn-ghost ot-btn-block" data-act="set.openFolder">查看导出文件夹</button>
      </div>
      <label class="ot-field" style="margin-top:10px">
        <span class="ot-field-label">导入备份（把导出的 JSON 内容粘贴到这里）</span>
        <textarea class="ot-input" data-read="importText" placeholder='{"2026-09-18":{"in":"09:02","out":"21:35","ot":3.6,"type":"weekday","note":""}}'></textarea>
      </label>
      <div class="ot-row" style="margin-top:8px">
        <button class="ot-btn ot-btn-soft ot-btn-block" data-act="set.importMerge">合并导入</button>
        <button class="ot-btn ot-btn-soft ot-btn-block" data-act="set.importReplace">覆盖导入</button>
      </div>
      <div class="ot-mini" style="margin-top:8px">当前存储：<span data-bind="adapterName">local</span> · 共 <span data-bind="recordCount">0</span> 天记录</div>
    </div>

    <div class="ot-card">
      <div class="ot-card-title" style="color:var(--c-danger)">危险操作</div>
      <button class="ot-btn ot-btn-danger ot-btn-block" data-act="set.clear"
        data-confirm="确认清空全部打卡记录？此操作不可恢复">清空全部数据</button>
    </div>

    <div class="ot-card">
      <div class="ot-card-title">关于</div>
      <div class="ot-sub" data-bind="aboutText">加班日历 · 每日打卡与加班记录</div>
      <div class="ot-mini" style="margin-top:6px">界面与逻辑解耦：改 tokens.css 换配色，改 views/*.js 换布局，业务与数据零改动</div>
    </div>

  </div>
</div>`;
