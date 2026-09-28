// ============================================================
// 视图模板：背景裁剪（全屏弹层，所见即手机上的最终效果）
// 【钩子】data-ot="cropFrame" 拖动区、data-ot="cropZoom" 缩放条、
//         动作 crop.reset / crop.apply / modal.close
// ============================================================
OT.tpl.crop = `
<div class="ot-cropwrap">
  <div class="ot-crop-frame" data-ot="cropFrame">
    <div class="ot-crop-img"></div>
    <div class="ot-crop-grid"></div>
  </div>
  <div class="ot-crop-tip">拖动画面调整位置 · 底部滑块缩放</div>
</div>

<div class="ot-crop-bar">
  <div class="ot-between">
    <span class="ot-sub">缩放</span>
    <span class="ot-strong ot-num" data-bind="zoomText">100%</span>
  </div>
  <input class="ot-range" type="range" min="100" max="300" step="5" value="100" data-ot="cropZoom">
  <div class="ot-row" style="margin-top:10px">
    <button class="ot-btn ot-btn-ghost ot-btn-block" data-act="crop.reset">重置</button>
    <button class="ot-btn ot-btn-ghost ot-btn-block" data-act="modal.close">取消</button>
    <button class="ot-btn ot-btn-primary ot-btn-block" data-act="crop.apply">应用</button>
  </div>
</div>`;
