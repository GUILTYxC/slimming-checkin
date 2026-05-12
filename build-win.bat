@echo off
chcp 65001 >nul
cd /d D:\AI\AiCode\OpenCode\slimming-checkin

echo 清理旧的构建文件...
if exist release rmdir /s /q release

echo 设置镜像源...
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

echo 开始打包...
call pnpm run electron:build

echo.
echo 打包完成！
echo 安装包位置: release\
echo.
pause
