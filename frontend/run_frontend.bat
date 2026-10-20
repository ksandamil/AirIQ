@echo off
title Beijing AirIQ - React TypeScript Frontend
cd /d "%~dp0"
echo =========================================================================
echo   Beijing AirIQ - Next-Hour PM2.5 Intelligence System (React + TypeScript)
echo =========================================================================
echo.
echo Starting Vite React Dev Server on http://localhost:5173 ...
start http://localhost:5173
npm run dev
pause
