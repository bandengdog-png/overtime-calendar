# ============================================================
# 一键同步交付：重新打包 APK 并更新 E:\王忆天\软件\加班日历
# 用法：右键“使用 PowerShell 运行”，或：
#   powershell -ExecutionPolicy Bypass -File tools\sync_delivery.ps1
# 作用：改了界面或逻辑后，重新打包并把 APK、前端源码、壳工程同步到交付目录。
# ============================================================
$ErrorActionPreference = 'Continue'

$Root = Split-Path $PSScriptRoot -Parent
$BuildScript = Join-Path $Root 'tools\build_apk.ps1'
$Deliver = 'E:\王忆天\软件\加班日历'

Write-Host '== 同步交付到 E:\王忆天\软件\加班日历 ==' -ForegroundColor Cyan

# 1) 重新打包 APK（产出 build\加班日历.apk）
if (Test-Path $BuildScript) {
    Write-Host '[1/3] 重新打包 APK ...' -ForegroundColor Cyan
    & powershell -ExecutionPolicy Bypass -File $BuildScript
} else {
    Write-Host "未找到打包脚本: $BuildScript" -ForegroundColor Red
}

# 2) 创建交付目录并复制
try {
    New-Item -ItemType Directory -Force -Path $Deliver | Out-Null
    Write-Host '[2/3] 复制到交付目录 ...' -ForegroundColor Cyan
    Copy-Item -Force (Join-Path $Root 'build\加班日历.apk') $Deliver
    if (Test-Path "$Deliver\app源码") { Remove-Item -Recurse -Force "$Deliver\app源码" }
    Copy-Item -Recurse -Force (Join-Path $Root 'app') "$Deliver\app源码"
    if (Test-Path "$Deliver\android壳") { Remove-Item -Recurse -Force "$Deliver\android壳" }
    Copy-Item -Recurse -Force (Join-Path $Root 'android-shell') "$Deliver\android壳"
    if (Test-Path "$Deliver\打包工具") { Remove-Item -Recurse -Force "$Deliver\打包工具" }
    Copy-Item -Recurse -Force (Join-Path $Root 'tools') "$Deliver\打包工具"
    Copy-Item -Force (Join-Path $Root '安装与使用说明.txt') $Deliver
    Write-Host '[3/3] 同步完成：' -ForegroundColor Green
    Get-ChildItem $Deliver | Select-Object Name, @{n='大小';e={ if ($_.PSIsContainer) {'<目录>'} else {'{0} KB' -f [math]::Round($_.Length/1KB,1)} }}
} catch {
    Write-Host "同步到 $Deliver 失败（可能没有权限）。" -ForegroundColor Yellow
    Write-Host "至少可用的新 APK：$Root\build\加班日历.apk" -ForegroundColor Yellow
}
