@echo off
echo Building RTX Innovations Electron App...
echo.

echo Installing dependencies...
call npm install

echo.
echo Building webpack bundle...
call npm run build

echo.
echo Building Electron app (normal mode)...
call npm run build-win
echo To run a diagnostic SAFE build, launch the installed app with --safe or set TF_SAFE_MODE=1.

echo.
echo Build completed successfully!
echo Check the dist-builds folder for the executable.
pause 