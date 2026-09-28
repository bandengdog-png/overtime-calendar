// ============================================================
// 本地静态预览服务（仅开发调试用，不参与 APK 打包）
// 用法：node tools/dev_server.js [端口]   默认 8080
//   浏览器打开 http://localhost:8080/index.html
//   只改 ui/ 下的样式或模板时，刷新浏览器即可看到效果，无需重新打包 APK
// ============================================================
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'app');
const port = Number(process.argv[2] || 8080);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

http.createServer(function (req, res) {
  let p = decodeURIComponent(String(req.url).split('?')[0]);
  if (p === '/' || p === '') p = '/index.html';
  const file = path.join(root, p);
  if (file !== root && !file.startsWith(root + path.sep)) {
    res.writeHead(403); res.end('forbidden'); return;
  }
  fs.readFile(file, function (err, buf) {
    if (err) { res.writeHead(404); res.end('404 not found: ' + p); return; }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(buf);
  });
}).listen(port, function () {
  console.log('加班日历 本地预览: http://localhost:' + port + '/index.html');
});
