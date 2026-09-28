// ============================================================
// 运行配置（只放运行参数，不放界面、不放业务算法）
// ============================================================
window.OT = window.OT || {};
OT.tpl = OT.tpl || {};      // 视图模板注册表，由 ui/views/*.js 填充
OT.state = OT.state || {};  // 运行时状态

OT.config = {
  appName: '加班日历',
  appSub: '每日打卡与加班记录',
  storage: 'local',         // 'local' = 离线本地存储（默认）；'http' = 走 apiBase（预留）
  apiBase: '',              // storage='http' 时填写服务端地址
  vibrateMs: 60,            // 打卡震动时长（毫秒）
  // 底部 Tab 顺序（与 ui/views/chrome.js 里 Tab 按钮的 data-arg 对应）
  tabs: ['home', 'cal', 'stat', 'set']
};
