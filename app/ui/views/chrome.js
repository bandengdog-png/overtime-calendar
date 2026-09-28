// ============================================================
// 视图模板：顶栏 / 底部 Tab / 弹层外壳
// 【设计师改动区】以下是纯 HTML，改配色改 tokens.css，改结构改这里
// 【必须保留】data-ot / data-bind / data-act / data-bind-class 钩子
// ============================================================

// 顶部标题栏：data-bind="appName" 取 config.appName，data-bind="topBadge" 显示今日状态
OT.tpl.top = `
<header class="ot-top">
  <div class="ot-appname" data-bind="appName">加班日历</div>
  <span class="ot-top-badge" data-bind="topBadge">--</span>
</header>`;

// 底部导航：每个按钮的 data-arg 必须与 config.js 的 tabs 一致
OT.tpl.tabbar = `
<nav class="ot-tabbar" data-ot="tabbar">
  <button class="ot-tab" data-act="nav.go" data-arg="home">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 3v3M16 3v3"/><path d="M8.5 14.5l2.2 2.2 4.3-4.3"/></svg>
    <span>今日</span>
  </button>
  <button class="ot-tab" data-act="nav.go" data-arg="cal">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 3v3M16 3v3"/><path d="M7.5 13h.01M12 13h.01M16.5 13h.01M7.5 17h.01M12 17h.01"/></svg>
    <span>日历</span>
  </button>
  <button class="ot-tab" data-act="nav.go" data-arg="stat">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>
    <span>统计</span>
  </button>
  <button class="ot-tab" data-act="nav.go" data-arg="set">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M4.9 7l2.1 1.2M17 15.8l2.1 1.2M4.9 17l2.1-1.2M17 8.2l2.1-1.2"/></svg>
    <span>设置</span>
  </button>
</nav>`;

// 背景层：单独一层，便于裁剪 / 缩放 / 去模糊；模板结构请勿删（data-ot="bg"）
OT.tpl.bg = `
<div class="ot-bg" data-ot="bg">
  <div class="ot-bg-img"></div>
  <div class="ot-bg-scrim"></div>
</div>`;

// 弹层外壳（data-stop 用于阻止点击弹层内容时误关闭）
OT.tpl.mask = `
<div class="ot-mask" data-ot="mask" data-act="modal.close">
  <div class="ot-modal" data-ot="modal" data-stop="1"></div>
</div>`;

// 页面容器骨架（Tab 页面统一套这个）
OT.tpl.shell = `
<div class="ot-page">
  <div class="ot-pagebody"></div>
</div>`;
