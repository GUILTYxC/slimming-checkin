cd "D:\AI\AiCode\OpenCode\slimming-checkin"
Remove-Item -Recurse -Force "release" -ErrorAction SilentlyContinue
$env:ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
pnpm run electron:build 2>&1 | Tee-Object -FilePath "build.log"
Write-Host "打包完成，按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
