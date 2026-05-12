@echo off
cd /d D:\AI\AiCode\OpenCode\slimming-checkin

if exist release rmdir /s /q release

set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

call pnpm run electron:build

pause
