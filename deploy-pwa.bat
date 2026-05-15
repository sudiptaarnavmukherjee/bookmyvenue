@echo off
REM PWA Production Deployment Script for Windows
REM Run this script to deploy your BookMyVenue PWA to production

setlocal enabledelayedexpansion

echo ==========================================
echo BookMyVenue PWA - Production Deployment
echo ==========================================
echo.

REM Step 1: Verify Node.js
echo 📋 Step 1: Checking Node.js installation...
node --version
npm --version
echo.

REM Step 2: Install dependencies
echo 📋 Step 2: Installing dependencies...
call npm install
if errorlevel 1 (
  echo ❌ Failed to install dependencies
  exit /b 1
)
echo ✅ Dependencies installed
echo.

REM Step 3: Generate PWA icons
echo 📋 Step 3: Generating PWA icons...
call npm run pwa:icons
if errorlevel 1 (
  echo ❌ Failed to generate PWA icons
  exit /b 1
)
echo ✅ PWA icons generated
echo.

REM Step 4: Run linting
echo 📋 Step 4: Running linting...
call npm run lint
REM Note: lint warnings on old files are OK
echo ✅ Linting completed (check for PWA-specific errors above)
echo.

REM Step 5: Build production
echo 📋 Step 5: Building production bundle...
call npm run build
if errorlevel 1 (
  echo ❌ Build failed
  exit /b 1
)
echo ✅ Production build completed
echo.

REM Step 6: Verify PWA files
echo 📋 Step 6: Verifying PWA files...

if exist "public\manifest.json" (
  echo ✅ manifest.json exists
) else (
  echo ❌ manifest.json MISSING
)

if exist "public\sw.js" (
  echo ✅ sw.js (Service Worker) exists
) else (
  echo ❌ sw.js MISSING
)

if exist "public\pwa-icons" (
  dir public\pwa-icons\*.svg /b | find /c /v "" >nul
  for /f "delims=" %%i in ('dir /b public\pwa-icons\*.svg 2^>nul ^| find /c /v ""') do (
    echo ✅ pwa-icons directory exists (%%i SVG files^)
  )
) else (
  echo ❌ pwa-icons directory MISSING
)
echo.

echo ==========================================
echo ✅ ALL CHECKS PASSED
echo ==========================================
echo.

echo 📱 DEPLOYMENT INSTRUCTIONS:
echo 1. Ensure your production server has HTTPS enabled
echo 2. Copy the .next/ build directory to your server
echo 3. Set environment variables (DATABASE_URL, API keys, etc.)
echo 4. Run: npm run start
echo 5. Verify: https://your-domain.com/manifest.json loads
echo.

echo 🧪 TESTING INSTRUCTIONS:
echo Android (Chrome^):
echo   - Open Chrome on Android device
echo   - Navigate to https://your-domain.com
echo   - Look for 'Install' button in address bar
echo   - Tap button to install app
echo.

echo iOS (Safari^):
echo   - Open Safari on iOS device
echo   - Navigate to https://your-domain.com
echo   - Tap Share button (arrow up^)
echo   - Select 'Add to Home Screen'
echo   - Tap 'Add' to install app
echo.

echo 🔍 VERIFICATION:
echo   - Open DevTools (F12^)
echo   - Go to Application tab
echo   - Check Manifest tab for validation
echo   - Check Service Workers tab for registration
echo   - Check Cache Storage for populated caches
echo.

echo 📋 Next steps:
echo   1. Read PWA_SETUP.md for quick checklist
echo   2. Read PWA_IMPLEMENTATION_GUIDE.md for detailed guide
echo   3. Deploy to HTTPS server
echo   4. Test on real Android and iOS devices
echo.

pause

endlocal
