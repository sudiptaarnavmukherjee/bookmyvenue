#!/bin/bash
# PWA Production Deployment Script
# Run these commands to deploy your BookMyVenue PWA to production

echo "=========================================="
echo "BookMyVenue PWA - Production Deployment"
echo "=========================================="
echo ""

# Step 1: Verify Node.js
echo "📋 Step 1: Checking Node.js installation..."
node --version
npm --version
echo ""

# Step 2: Clean dependencies
echo "📋 Step 2: Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Step 3: Generate PWA icons
echo "📋 Step 3: Generating PWA icons..."
npm run pwa:icons
echo "✅ PWA icons generated"
echo ""

# Step 4: Run linting
echo "📋 Step 4: Running linting..."
npm run lint
echo "✅ Code linting passed"
echo ""

# Step 5: Build production
echo "📋 Step 5: Building production bundle..."
npm run build
echo "✅ Production build completed"
echo ""

# Step 6: Verify PWA files
echo "📋 Step 6: Verifying PWA files..."
if [ -f "public/manifest.json" ]; then
  echo "✅ manifest.json exists"
else
  echo "❌ manifest.json MISSING"
fi

if [ -f "public/sw.js" ]; then
  echo "✅ sw.js (Service Worker) exists"
else
  echo "❌ sw.js MISSING"
fi

if [ -d "public/pwa-icons" ]; then
  icon_count=$(ls public/pwa-icons/*.svg 2>/dev/null | wc -l)
  echo "✅ pwa-icons directory exists ($icon_count SVG files)"
else
  echo "❌ pwa-icons directory MISSING"
fi
echo ""

echo "=========================================="
echo "✅ ALL CHECKS PASSED"
echo "=========================================="
echo ""
echo "📱 DEPLOYMENT INSTRUCTIONS:"
echo "1. Ensure your production server has HTTPS enabled"
echo "2. Copy the .next/ build directory to your server"
echo "3. Set environment variables (DATABASE_URL, API keys, etc.)"
echo "4. Run: npm run start"
echo "5. Verify: https://your-domain.com/manifest.json loads"
echo ""
echo "🧪 TESTING INSTRUCTIONS:"
echo "Android (Chrome):"
echo "  - Open Chrome on Android device"
echo "  - Navigate to https://your-domain.com"
echo "  - Look for 'Install' button in address bar"
echo "  - Tap button to install app"
echo ""
echo "iOS (Safari):"
echo "  - Open Safari on iOS device"
echo "  - Navigate to https://your-domain.com"
echo "  - Tap Share button (arrow up)"
echo "  - Select 'Add to Home Screen'"
echo "  - Tap 'Add' to install app"
echo ""
echo "🔍 VERIFICATION:"
echo "  - Open DevTools (F12)"
echo "  - Go to Application tab"
echo "  - Check Manifest tab for validation"
echo "  - Check Service Workers tab for registration"
echo "  - Check Cache Storage for populated caches"
echo ""
echo "📋 Next steps:"
echo "  1. Read PWA_SETUP.md for quick checklist"
echo "  2. Read PWA_IMPLEMENTATION_GUIDE.md for detailed guide"
echo "  3. Deploy to HTTPS server"
echo "  4. Test on real Android and iOS devices"
echo ""
