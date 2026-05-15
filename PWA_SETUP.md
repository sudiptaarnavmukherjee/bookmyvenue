# PWA PRODUCTION SETUP - BookMyVenue

## Quick Start (5 minutes)

### 1. Generate PWA Icons

```bash
npm run pwa:icons
```

This creates all required PWA icons in `public/pwa-icons/`

### 2. Build for Production

```bash
npm run pwa:build
# OR manually:
npm run build
```

### 3. Test Locally

```bash
npm run start
```

Then on Android device:
- Open Chrome
- Navigate to your app
- Look for "Install" button in address bar
- Tap to install

---

## What's Implemented

✅ **Service Worker** - Automatic caching with smart strategies  
✅ **Install Prompt** - Android native + iOS manual instructions  
✅ **Offline Support** - Full offline page + cached content  
✅ **Background Sync** - Offline requests synced when online  
✅ **Push Notifications** - Optional notifications in browser  
✅ **Security** - HTTPS-only, secure headers, auth exclusions  
✅ **Performance** - Aggressive caching, lazy loading  
✅ **Full PWA Checklist** - All production requirements met  

---

## File Structure

```
public/
├── manifest.json           # PWA metadata
├── site.webmanifest        # Alternative format
├── sw.js                   # Service Worker
└── pwa-icons/              # Generated icons

src/components/pwa/
├── PWAInitializer.tsx      # Initializes PWA
├── PWAInstallPrompt.tsx    # Install UI
├── PWAComponents.tsx       # Banners & indicators
└── PushNotificationToggle.tsx

src/lib/
├── pwa-utils.ts           # Utilities

src/hooks/
├── usePWA.ts              # PWA state
└── useOfflineQueue.ts     # Offline requests
```

---

## Installation Testing

### Android Chrome (Best)

1. **Development:**
   ```bash
   npm run dev
   # Connect Android device
   # Open Chrome → navigate to your URL
   # Press address bar → "Install" appears
   ```

2. **Production:**
   - Deploy to HTTPS domain
   - No special setup needed
   - Chrome handles `beforeinstallprompt` automatically

### iOS Safari

1. Safari → Share button (bottom right)
2. "Add to Home Screen"
3. Customize name
4. Tap "Add"

**Note:** iOS has limited PWA support. No installation popup, but "Add to Home Screen" provides app-like experience.

---

## Key Features

### 1. Smart Caching
- **HTML:** Network-first (always fresh)
- **JS/CSS:** Stale-while-revalidate
- **Images:** Cache-first (background update)
- **Auth routes:** Never cached
- **Service Worker:** Always fetched (no cache)

### 2. Offline Offline Experience
- Cached pages load while offline
- IndexedDB stores pending requests
- Automatic sync when online
- Offline indicator shows status

### 3. Install Prompt
- Android: Native browser prompt
- iOS: Manual "Add to Home Screen" instructions
- Shows after 3-5 seconds on first visit
- Can be dismissed (won't re-show same day)

### 4. Security
- HTTPS required (except localhost)
- No auth data cached
- COOP/CORP headers
- Secure JWT session management

---

## Production Deployment Checklist

- [ ] Generated icons: `npm run pwa:icons`
- [ ] Build verified: `npm run build` (no errors)
- [ ] Service Worker loads: `/sw.js`
- [ ] Manifest accessible: `/manifest.json` or `/site.webmanifest`
- [ ] HTTPS enabled on domain
- [ ] Tested on Android Chrome
- [ ] Tested on iOS Safari
- [ ] DevTools shows SW registered
- [ ] No mixed content warnings
- [ ] Icons render correctly in installed app

---

## Troubleshooting

### Install Prompt Not Showing?

1. Check it's HTTPS (or localhost)
2. Verify manifest.json loads without errors
3. Check icons are accessible
4. Clear Chrome cache
5. Check DevTools → Application → Manifest

```javascript
// Check in browser console:
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log(regs));
```

### Service Worker Not Caching?

```javascript
// Check caches:
caches.keys().then(names => console.log(names));

// Manually clear caches:
caches.keys().then(names => {
  return Promise.all(names.map(name => caches.delete(name)));
});
```

### Offline Page Not Loading?

1. Verify `/offline` route exists
2. Clear all caches
3. Unregister SW and restart
4. Check network tab shows offline fallback

---

## Advanced Configuration

### Disable PWA Features

Edit `src/lib/pwa-utils.ts`:

```typescript
const DEFAULT_CONFIG: PWAConfig = {
  enableInstallPrompt: false,  // Disable install prompt
  enableOffline: true,         // Keep offline support
  enableNotifications: false,  // Disable push notifications
  cacheStrategy: 'minimal',    // Reduce caching
};
```

### Cache Size Limit

Edit `src/lib/pwa-utils.ts`:

```typescript
maxCacheSize: 50 * 1024 * 1024, // Change MB limit
```

### Update Check Interval

Edit `src/components/pwa/PWAInitializer.tsx`:

```javascript
setInterval(async () => {
  await registration.update();
}, 30 * 60 * 1000); // Check every 30 minutes
```

---

## Monitoring

### View All Console Logs

Search for `[PWA]` prefix in browser console:

```
[PWA] Service Worker registered: /
[PWA] beforeinstallprompt event captured
[PWA] App is online
[PWA] Cache cleared successfully
```

### Analytics Integration

Track PWA installations:

```javascript
window.addEventListener('appinstalled', () => {
  // Send event to analytics
  console.log('App installed');
});
```

---

## Production Best Practices

1. **Always use HTTPS**
   ```bash
   # Verify HSTS headers in response
   Strict-Transport-Security: max-age=63072000
   ```

2. **Monitor Cache Size**
   ```javascript
   const size = await getCacheSize();
   if (size > 45 * 1024 * 1024) {
     // Warn or clear caches
   }
   ```

3. **Clear Old Caches**
   ```bash
   # When deploying new version
   rm -rf public/pwa-icons/
   npm run pwa:icons
   ```

4. **Test on Real Devices**
   - Don't rely on emulator
   - Test on actual Android phone
   - Test on actual iPhone
   - Test on slow networks

---

## Need Help?

1. **Check Manifest:** `chrome://manifest` (in browser)
2. **Inspect SW:** DevTools → Application → Service Workers
3. **View Cache:** DevTools → Application → Cache Storage
4. **Debug Offline:** DevTools → Application → Offline (checkbox)

---

For detailed information, see **PWA_IMPLEMENTATION_GUIDE.md**

