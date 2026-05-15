# BookMyVenue PWA Implementation Guide

## Overview

This document covers the complete production-ready Progressive Web App (PWA) implementation for BookMyVenue, including:
- Service Worker configuration
- Install prompt handling for Android and iOS
- Offline functionality
- Cache strategies
- Background sync
- Push notifications

---

## 1. Installation and Trigger Setup

### 1.1 Web App Manifest

**Location:** `public/manifest.json`

The manifest file defines your PWA metadata and triggers the install prompt. Key elements:

```json
{
  "name": "BookMyVenue - Wedding Venues & Catering Marketplace",
  "short_name": "BookMyVenue",
  "display": "standalone",
  "start_url": "/",
  "scope": "/",
  "theme_color": "#ec4899",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/pwa-icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    }
  ]
}
```

**Important:** The manifest requires:
- ✓ HTTPS connection (or localhost)
- ✓ Valid icons in specified sizes
- ✓ Proper MIME type headers

### 1.2 Service Worker Registration

**Location:** `src/components/pwa/PWAInitializer.tsx`

Automatically registers the service worker on app load:
- Monitors for updates every hour
- Handles controller changes
- Registers background sync
- Detects standalone mode

### 1.3 Install Prompt Handler

**Location:** `src/components/pwa/PWAInstallPrompt.tsx`

Handles platform-specific installation:

#### Android
- Captures `beforeinstallprompt` event
- Shows native install banner
- Triggers browser install dialog

#### iOS
- Provides manual "Add to Home Screen" instructions
- Uses Share button workflow
- No automatic prompt (Apple limitation)

---

## 2. Icon Generation

### 2.1 Generating PWA Icons

Run the icon generation script to create all required icons:

```bash
# With default placeholder icons
npm run generate:pwa-icons

# With custom source image
npm run generate:pwa-icons public/logo-512.png
```

**Requirements:**
- Source image should be at least 512x512
- Icons created in: `public/pwa-icons/`
- Supports both PNG and SVG formats

**Icon Sizes Generated:**
- 72x72, 96x96, 128x128, 144x144
- 152x152, 192x192, 384x384, 512x512
- Maskable variants (192x192, 512x512) for adaptive icons on Android

### 2.2 Add to package.json

If not already present, add this script:

```json
{
  "scripts": {
    "generate:pwa-icons": "node scripts/generate-pwa-icons.js",
    "pwa": "npm run generate:pwa-icons && npm run build"
  }
}
```

---

## 3. Testing the Install Prompt

### 3.1 Android (Chrome/Edge)

1. **Development Testing:**
   ```bash
   npm run dev
   # Open in Chrome on Android
   # Install DevTools on desktop
   # Check Application > Manifest
   ```

2. **Production Testing (after deployment):**
   - Deploy to HTTPS domain
   - Open on Android device
   - Look for "Install" button in address bar
   - Or three-dot menu → "Install app"

3. **Debugging the beforeinstallprompt event:**
   ```javascript
   window.addEventListener('beforeinstallprompt', (e) => {
     console.log('[PWA] beforeinstallprompt triggered');
     console.log(e);
   });
   ```

### 3.2 iOS (Safari)

1. **Add to Home Screen:**
   - Open Safari
   - Tap Share button (bottom right)
   - Select "Add to Home Screen"
   - Customize name (appears on app icon)
   - Tap "Add"

2. **Check Installation:**
   - App icon appears on home screen
   - Launches in fullscreen (stdout display)
   - Accesses offline content via service worker

### 3.3 DevTools Inspection

**Chrome DevTools:**
- Application tab → Manifest
- Application tab → Service Workers
- Storage tab → Cache Storage
- Application tab → Install Prompt events

**Verify:**
- ✓ Manifest loads without errors
- ✓ No HTTPS or icon size issues
- ✓ Service Worker registered
- ✓ beforeinstallprompt fires on Android

---

## 4. Service Worker Configuration

### 4.1 Location and Behavior

**File:** `public/sw.js`

**Caching Strategy by Resource Type:**

| Resource Type | Strategy | Cache Name | TTL |
|---|---|---|---|
| HTML (navigation) | Network first | static-v2 | No cache |
| CSS/JS (static) | Stale while revalidate | static-v2 | Long |
| Images | Cache first | images-v2 | Long |
| API calls | Network first | dynamic-v2 | 24h |
| Auth routes | Never cached | - | - |
| Service Worker | No cache | - | Always fetch |

### 4.2 Offline Fallback

**Offline Page:** `src/app/offline/page.tsx`

When offline and no cached response available:
- Navigation requests → `/offline` page
- API failures → Return cached data or error
- Images → Return cached or placeholder

### 4.3 Cache Management

**Cache Cleanup:**
```javascript
import { clearPWACache, getCacheSize } from '@/lib/pwa-utils';

// Clear all caches
await clearPWACache();

// Check cache size
const sizeBytes = await getCacheSize();
const sizeMB = sizeBytes / 1024 / 1024;
console.log(`Cache size: ${sizeMB.toFixed(2)} MB`);
```

**Max Cache Size:** 50MB (configurable in `src/lib/pwa-utils.ts`)

---

## 5. Offline Functionality

### 5.1 Offline Indicator Component

**Location:** `src/components/pwa/PWAComponents.tsx`

Displays status bar showing:
- Offline/Online status
- Number of pending requests
- Sync status during background sync

### 5.2 Offline Request Queue

**Database:** IndexedDB (`BookMyVenue_Offline`)

Stores pending requests when offline:
- High priority: Auth, Payment
- Normal priority: Bookings, Profile updates
- Low priority: Analytics, Metrics

Automatically syncs when online via background sync.

### 5.3 Manual Offline Queue Access

```javascript
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

export function MyComponent() {
  const { pendingCount, isSyncing } = useOfflineQueue();
  
  return (
    <div>
      Pending: {pendingCount}
      {isSyncing && <p>Syncing...</p>}
    </div>
  );
}
```

---

## 6. Push Notifications

### 6.1 Setup

**Hook:** `src/hooks/usePushNotifications.ts`
**Component:** `src/components/pwa/PushNotificationToggle.tsx`

### 6.2 Enabling Notifications

```javascript
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function NotificationSettings() {
  const { isSupported, isSubscribed, subscribe } = usePushNotifications();
  
  if (!isSupported) return <p>Not supported</p>;
  
  return (
    <button onClick={subscribe}>
      {isSubscribed ? 'Disable' : 'Enable'} Notifications
    </button>
  );
}
```

### 6.3 Notifications Summary Info

Located on profile page. Users can toggle push notifications on/off.

---

## 7. Production Deployment Checklist

### 7.1 Pre-Deployment

- [ ] Generate production icons: `npm run generate:pwa-icons`
- [ ] Build app: `npm run build`
- [ ] Run: `npm run start`
- [ ] Test locally on real device via ngrok or similar

### 7.2 HTTPS Requirements

PWA **requires HTTPS** (except localhost):

- [ ] SSL certificate installed
- [ ] All mixed content warnings resolved
- [ ] HTTPS redirects configured
- [ ] HSTS headers enabled (already configured)

### 7.3 Manifest and Headers

- [ ] `manifest.json` served with `Content-Type: application/manifest+json`
- [ ] Service Worker cached correctly (no-cache policy)
- [ ] Cache-Control headers set appropriately
- [ ] Icons accessible at specified paths

### 7.4 Performance

- [ ] Service Worker doesn't cache auth routes
- [ ] Icons optimized (use `npm run generate:pwa-icons` first)
- [ ] Cache size monitored (max 50MB)
- [ ] Stale cache versions cleaned up

### 7.5 Testing on Real Devices

**Android:**
```bash
# Connect device via USB
# Enable USB debugging
# Open Chrome DevTools → Remote devices
adb reverse tcp:3000 tcp:3000
# Open localhost:3000 on device Chrome
```

**iOS:**
- Use real device (simulator doesn't fully support PWA)
- iOS Safari support is currently limited (no install popup)
- Use "Add to Home Screen" workflow

---

## 8. Monitoring and Updates

### 8.1 Service Worker Updates

The PWA checks for updates:
- Every hour automatically
- When app comes to foreground
- Manual update available via utility

**Update Check:**
```javascript
import { updateServiceWorker } from '@/lib/pwa-utils';

await updateServiceWorker();
```

### 8.2 Logging

All PWA activities logged with `[PWA]` prefix:

```bash
[PWA] Service Worker registered: /
[PWA] beforeinstallprompt event captured
[PWA] App is online
[PWA] Cache cleared successfully
```

Check browser console for diagnostics.

### 8.3 Analytics Integration

PWA installation tracking:

```javascript
window.addEventListener('appinstalled', () => {
  // Log installation event
  gtag('event', 'app_installed');
});

window.addEventListener('beforeinstallprompt', () => {
  // Log install prompt shown
  gtag('event', 'install_prompt_shown');
});
```

---

## 9. Troubleshooting

### 9.1 Install Prompt Not Showing (Android)

**Check:**
- [ ] Using HTTPS (or localhost)
- [ ] All manifest icons accessible
- [ ] Icon sizes exactly as specified
- [ ] Service Worker registered successfully
- [ ] DevTools → Application → Manifest shows no errors

**Fix:**
```bash
# Clear Chrome cache
# Check browser console for errors
# Verify manifest.json loads: chrome://manifest
```

### 9.2 Service Worker Not Caching

**Check:**
```javascript
// In DevTools Console
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(r => console.log(r));
});

// Check caches
caches.keys().then(names => console.log(names));
```

**Fix:**
- Ensure SW file at `/sw.js`
- Check Service-Worker-Allowed header
- Verify cache strategy in sw.js

### 9.3 Offline Page Not Showing

**Check:**
- [ ] `/offline` route exists and renders
- [ ] SW has offline page cached
- [ ] Network fallback configured in sw.js

**Fix:**
```bash
# Clear all caches
# Unregister SW and re-register
# Check `/offline` page accessibility
```

### 9.4 iOS App Not Installing

**Note:** iOS PWA support is limited. No automatic install prompt.

**Workaround:**
- Provide installation instructions in UI
- Safari → Share → Add to Home Screen
- Installs with app-like experience (no address bar)

---

## 10. File Structure Reference

```
public/
├── manifest.json          # PWA metadata
├── site.webmanifest       # Alternative manifest format
├── sw.js                  # Service Worker
└── pwa-icons/             # Generated icon assets
    ├── icon-72x72.png
    ├── icon-192x192.png
    ├── icon-512x512.png
    └── ... (all generated sizes)

src/
├── components/pwa/
│   ├── PWAInitializer.tsx      # Initializes PWA on mount
│   ├── PWAInstallPrompt.tsx    # Shows install prompt
│   ├── PWAComponents.tsx       # Offline/install banners
│   └── PushNotificationToggle.tsx  # Notification toggle
├── hooks/
│   ├── usePWA.ts              # PWA state hook
│   ├── usePushNotifications.ts # Push notifications hook
│   └── useOfflineQueue.ts      # Offline queue hook
├── lib/
│   └── pwa-utils.ts           # PWA utility functions
└── app/
    ├── layout.tsx             # Includes PWAInitializer
    └── offline/
        └── page.tsx           # Offline fallback page

scripts/
└── generate-pwa-icons.js      # Icon generation script
```

---

## 11. Next Steps

1. **Generate Icons:**
   ```bash
   npm run generate:pwa-icons
   ```

2. **Test Locally:**
   ```bash
   npm run dev
   # Test on real device via ngrok
   ```

3. **Deploy to Production:**
   ```bash
   npm run build
   npm run start
   ```

4. **Monitor Installation:**
   - Check DevTools for SW registration
   - Test installation on Android and iOS
   - Monitor analytics for app_installed events

---

## Support and Resources

- **MDN PWA Documentation:** https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- **Web.dev PWA Guide:** https://web.dev/progressive-web-apps/
- **Chrome DevTools PWA Debugging:** https://developer.chrome.com/docs/devtools/progressive-web-apps/
- **Manifest Validator:** https://www.installpwa.com/

---

**Last Updated:** 2026-05-16  
**Status:** Production Ready
