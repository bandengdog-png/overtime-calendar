// ============================================================
// 绑定层：原生能力封装（振动 / Toast / 导出文件 / 打开文件夹）
// WebView 里由壳注入 window.OTNative；浏览器里自动降级
// ============================================================
OT.bridge = (function () {
  var native = window.OTNative || null;

  function isNative() { return !!native; }
  function vibrate(ms) {
    ms = Math.max(1, Number(ms) || 40);
    if (native) { try { native.vibrate(ms); return; } catch (e) {} }
    if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} }
  }
  function toast(msg) {
    if (native) { try { native.toast(String(msg)); return; } catch (e) {} }
    if (OT.bridge._toastUI) OT.bridge._toastUI(String(msg));
  }
  // 导出文件：APK 内落到 Download/王忆天/软件/<sub>；浏览器里下载
  function exportFile(name, content, sub) {
    if (native) { try { return String(native.exportFile(String(name), String(content), String(sub || ''))); } catch (e) { return '导出失败:' + e; } }
    try {
      var blob = new Blob([String(content)], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = String(name);
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      return '已下载:' + name;
    } catch (e) { return '导出失败:' + e; }
  }
  function listFiles(sub) {
    if (native) { try { return String(native.listFiles(String(sub || ''))); } catch (e) { return '[]'; } }
    return '[]';
  }
  function openFolder(sub) {
    if (native) { try { native.openFolder(String(sub || '')); return; } catch (e) {} }
    window.alert('（浏览器模式）手机上的导出目录为：Download/王忆天/软件/' + (sub || ''));
  }
  function deviceInfo() {
    try { return native ? JSON.parse(native.getDeviceInfo()) : { platform: 'browser' }; }
    catch (e) { return { platform: 'browser' }; }
  }

  return {
    _toastUI: null,
    isNative: isNative, vibrate: vibrate, toast: toast,
    exportFile: exportFile, listFiles: listFiles, openFolder: openFolder, deviceInfo: deviceInfo
  };
})();
