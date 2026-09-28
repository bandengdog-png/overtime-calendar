# ============================================================
# 加班日历 - 离线一键打包 APK（WebView壳 + app前端）
# 用法: powershell -ExecutionPolicy Bypass -File tools\build_apk.ps1
# 产物: build\加班日历.apk  （并交付到 E:\王忆天\软件\加班日历）
# 说明: 编译过程在 ASCII 临时目录进行，避免中文路径传给原生工具乱码。
# 工具链查找顺序：环境变量 → 项目同级「组件」目录 → 相邻项目组件目录
# ============================================================
$ErrorActionPreference = 'Continue'

$Root  = Split-Path $PSScriptRoot -Parent
$Shell = Join-Path $Root 'android-shell'
$AppDir= Join-Path $Root 'app'
$Build = Join-Path $Root 'build'
$Pack  = Split-Path $Root -Parent

function Find-Dir($cands) {
  foreach ($c in $cands) { if ($c -and (Test-Path $c)) { return $c } }
  return $null
}
$AndroidHome = Find-Dir @(
  $env:ANDROID_HOME,
  (Join-Path $Pack '组件\Android'),
  (Join-Path $Root '组件\Android'),
  'E:\王忆天\小车软件\组件\Android'
)
$JavaHome = Find-Dir @(
  $env:JAVA_HOME,
  (Join-Path $Pack '组件\JDK\jdk-17'),
  (Join-Path $Root '组件\JDK\jdk-17'),
  'E:\王忆天\小车软件\组件\JDK\jdk-17'
)
if (-not $AndroidHome) { Write-Host '未找到 Android 工具链（组件\Android）' -ForegroundColor Red; exit 1 }
if (-not $JavaHome) { Write-Host '未找到 JDK（组件\JDK\jdk-17）' -ForegroundColor Red; exit 1 }
$BT     = Join-Path $AndroidHome 'build-tools\34.0.0'
$Plat   = Join-Path $AndroidHome 'platforms\android-35'
$androidJar = Join-Path $Plat 'android.jar'

$aapt2     = Join-Path $BT 'aapt2.exe'
$zipalign  = Join-Path $BT 'zipalign.exe'
$apksigner = Join-Path $BT 'apksigner.bat'
$d8        = Join-Path $BT 'd8.bat'
$javac     = Join-Path $JavaHome 'bin\javac.exe'
$jar       = Join-Path $JavaHome 'bin\jar.exe'
$keystore  = Join-Path $AndroidHome 'debug.keystore'

$env:ANDROID_HOME = $AndroidHome
$env:JAVA_HOME = $JavaHome
$env:PATH = "$BT;$env:PATH"

$ApkName = '加班日历.apk'
$FinalApk = Join-Path $Build $ApkName

Write-Host '== 加班日历 APK 打包 ==' -ForegroundColor Cyan
foreach ($p in @($Shell,$AppDir,$BT,$Plat,$androidJar,$keystore,$aapt2,$javac,$d8,$apksigner,$zipalign)) {
  if (-not (Test-Path $p)) { Write-Host "缺少依赖: $p" -ForegroundColor Red; exit 1 }
}

# 1) 准备 ASCII 构建区（原生工具在中文路径下会乱码）
$Stage = Join-Path $env:TEMP 'ot_cal_build'
if (Test-Path $Stage) { Remove-Item -Recurse -Force $Stage }
New-Item -ItemType Directory -Force -Path $Stage | Out-Null
$ShellS = Join-Path $Stage 'shell'
$AppS   = Join-Path $Stage 'app'
$Work   = Join-Path $Stage '.build'
New-Item -ItemType Directory -Force -Path "$ShellS" | Out-Null
Copy-Item -Recurse -Force (Join-Path $Shell 'res') "$ShellS\res"
Copy-Item -Recurse -Force (Join-Path $Shell 'java') "$ShellS\java"
Copy-Item -Force (Join-Path $Shell 'AndroidManifest.xml') "$ShellS\AndroidManifest.xml"
Copy-Item -Recurse -Force $AppDir $AppS
# 原生工具无法正确接收中文路径参数，统一放到 ASCII 构建区
$aJar   = Join-Path $Stage 'android.jar'
$aKey   = Join-Path $Stage 'debug.keystore'
Copy-Item -Force $androidJar $aJar
Copy-Item -Force $keystore $aKey

foreach ($d in @('compiled','classes','dex','assets')) { New-Item -ItemType Directory -Force -Path "$Work\$d" | Out-Null }
New-Item -ItemType Directory -Force -Path $Build | Out-Null

Write-Host '[1/8] 编译资源 ...'
& $aapt2 compile --dir "$ShellS\res" -o "$Work\compiled"
if ($LASTEXITCODE -ne 0) { throw 'aapt2 compile 失败' }
$flat = Get-ChildItem "$Work\compiled" -Recurse -Filter *.flat
if (-not $flat) { throw '资源编译无输出' }

Write-Host '[2/8] 打包资源/清单(assets 用 jar 注入，避免 aapt2 反斜杠问题) ...'
$manifest = Join-Path $ShellS 'AndroidManifest.xml'
& $aapt2 link -o "$Work\base.apk" -I $aJar --manifest $manifest --auto-add-overlay @($flat | ForEach-Object { $_.FullName })
if ($LASTEXITCODE -ne 0) { throw 'aapt2 link 失败' }

Write-Host '[3/8] javac 编译壳工程 ...'
$srcArgs = @()
foreach ($f in (Get-ChildItem (Join-Path $ShellS 'java') -Recurse -Filter *.java)) { $srcArgs += $f.FullName }
& $javac -encoding UTF-8 -source 1.8 -target 1.8 -bootclasspath $aJar -d "$Work\classes" @srcArgs 2>&1 | ForEach-Object { Write-Host $_ }
if ($LASTEXITCODE -ne 0) { throw 'javac 编译失败' }

Write-Host '[4/8] class -> jar -> dex ...'
& $jar cf "$Work\classes.jar" -C "$Work\classes" .
& $d8 --lib $aJar --min-api 24 --release --output "$Work\dex" "$Work\classes.jar"
if (-not (Test-Path "$Work\dex\classes.dex")) { throw 'd8 无输出 classes.dex' }

Write-Host '[5/8] jar 注入 assets/app 前端 与 classes.dex（规范斜杠）...'
$ZipStage = Join-Path $Work 'zipstage'
if (Test-Path $ZipStage) { Remove-Item -Recurse -Force $ZipStage }
New-Item -ItemType Directory -Force -Path "$ZipStage\assets" | Out-Null
Copy-Item -Recurse -Force $AppS "$ZipStage\assets\app"
Copy-Item -Force "$Work\dex\classes.dex" "$ZipStage\classes.dex"
& $jar uf "$Work\base.apk" -C $ZipStage .
if ($LASTEXITCODE -ne 0) { throw '注入 assets/dex 失败' }

Write-Host '[6/8] zipalign 对齐 ...'
& $zipalign -f 4 "$Work\base.apk" "$Work\aligned.apk"
if (-not (Test-Path "$Work\aligned.apk")) { throw 'zipalign 失败' }

Write-Host '[7/8] apksigner 签名 (debug key) ...'
& $apksigner sign --ks $aKey --ks-key-alias androiddebugkey --ks-pass pass:androiddebugkey --key-pass pass:androiddebugkey --out $FinalApk "$Work\aligned.apk"
if ($LASTEXITCODE -ne 0) { throw '签名失败' }

$size = [math]::Round((Get-Item $FinalApk).Length / 1MB, 2)
Write-Host "[8/8] 完成: $FinalApk (${size} MB)" -ForegroundColor Green

$Deliver = if (Test-Path 'E:\王忆天\软件') { 'E:\王忆天\软件\加班日历' } else { Join-Path $Pack '交付' }
try {
  New-Item -ItemType Directory -Force -Path $Deliver | Out-Null
  Copy-Item -Force $FinalApk $Deliver
  Write-Host "已交付到: $Deliver" -ForegroundColor Green
} catch {
  Write-Host "自动交付到 $Deliver 失败（可能是权限/沙箱限制）。" -ForegroundColor Yellow
  Write-Host "请手动复制: $FinalApk  ->  $Deliver" -ForegroundColor Yellow
}
