# PWA Setup Guide for School Schedule Calendar

## ✅ What's Already Done

Your calendar site is now fully configured as a Progressive Web App (PWA) with:

- ✅ **manifest.json** - PWA manifest with Android and iOS support
- ✅ **sw.js** - Service worker with intelligent caching
- ✅ **index.html** - Updated with manifest link, service worker registration, and iOS meta tags

## 📱 Required Icons

To complete the PWA setup, you need to generate the following icon sizes from your existing `apple-touch-icon.png`:

### Icon Checklist

- ✅ **favicon.ico** (48x48) - Already exists
- ✅ **apple-touch-icon.png** (180x180) - Already exists
- ⚠️ **favicon.png** (32x32) - **NEEDS TO BE CREATED**
- ⚠️ **icon-192.png** (192x192) - **NEEDS TO BE CREATED** (Android home screen)
- ⚠️ **icon-192-maskable.png** (192x192) - **NEEDS TO BE CREATED** (Android adaptive icon)
- ⚠️ **icon-512.png** (512x512) - **NEEDS TO BE CREATED** (Android splash screen)
- ⚠️ **icon-512-maskable.png** (512x512) - **NEEDS TO BE CREATED** (Android adaptive icon)
- ⚠️ **safari-pinned-tab.svg** - **OPTIONAL** (Safari pinned tab monochrome icon)

### How to Generate Icons

#### Option 1: Using ImageMagick (Command Line)

```bash
# Install ImageMagick if you don't have it
# macOS: brew install imagemagick
# Ubuntu/Debian: sudo apt-get install imagemagick
# Windows: Download from https://imagemagick.org/

# Navigate to your project directory
cd /home/user/school-schedule

# Generate all required sizes
convert apple-touch-icon.png -resize 32x32 favicon.png
convert apple-touch-icon.png -resize 192x192 icon-192.png
convert apple-touch-icon.png -resize 512x512 icon-512.png

# For maskable icons (with safe zone padding)
# Maskable icons need 40% padding around the content
convert apple-touch-icon.png -resize 115x115 -gravity center -extent 192x192 -background "#1e293b" icon-192-maskable.png
convert apple-touch-icon.png -resize 307x307 -gravity center -extent 512x512 -background "#1e293b" icon-512-maskable.png
```

#### Option 2: Using Online Tools

**PWA Asset Generator** (Recommended for beginners)
1. Visit: https://www.pwabuilder.com/imageGenerator
2. Upload your `apple-touch-icon.png` (180x180)
3. Select platform: "All platforms"
4. Download the generated icon pack
5. Replace the icons in your project root

**Favicon.io**
1. Visit: https://favicon.io/favicon-converter/
2. Upload your `apple-touch-icon.png`
3. Download the generated favicon package
4. Extract and use the appropriate sizes

#### Option 3: Using Node.js Script

Create a file called `generate-icons.js`:

```javascript
const sharp = require('sharp');
const fs = require('fs');

const sizes = [
  { size: 32, name: 'favicon.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' }
];

const maskableSizes = [
  { size: 192, name: 'icon-192-maskable.png', padding: 77 },
  { size: 512, name: 'icon-512-maskable.png', padding: 205 }
];

async function generateIcons() {
  const source = 'apple-touch-icon.png';

  // Generate standard icons
  for (const { size, name } of sizes) {
    await sharp(source)
      .resize(size, size)
      .toFile(name);
    console.log(`✅ Generated ${name}`);
  }

  // Generate maskable icons (with padding)
  for (const { size, name, padding } of maskableSizes) {
    await sharp(source)
      .resize(size - (padding * 2), size - (padding * 2))
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 30, g: 41, b: 59, alpha: 1 } // #1e293b
      })
      .toFile(name);
    console.log(`✅ Generated ${name} (maskable)`);
  }
}

generateIcons().catch(console.error);
```

Then run:
```bash
npm install sharp
node generate-icons.js
```

## 🍎 iOS-Specific Setup & Quirks

### What's Already Configured

Your `index.html` already includes the necessary iOS meta tags:

```html
<!-- iOS full screen and status bar -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Schedule">

<!-- iOS icon -->
<link rel="apple-touch-icon" sizes="180x180" href="apple-touch-icon.png">

<!-- Safe area insets (already in CSS) -->
padding-top: calc(20px + env(safe-area-inset-top));
```

### iOS Quirks & Best Practices

#### 1. **Home Screen Installation**
- ✅ Users must manually add to home screen via Share button → "Add to Home Screen"
- ✅ No automatic install prompt like Android
- ✅ Your app title will be "Schedule" (from `apple-mobile-web-app-title`)

#### 2. **Status Bar Styling**
- ✅ `black-translucent` - Status bar blends with your dark theme
- ⚠️ **Your content already uses `env(safe-area-inset-top)` for notch/safe area** - Perfect!
- 💡 Alternative values: `default` (white), `black` (black)

#### 3. **Splash Screen**
- ⚠️ iOS generates splash screens automatically from your icon and background color
- ⚠️ No manual control - iOS uses `background_color` from manifest.json (#1e293b)
- 💡 For custom splash screens, you'd need specific `<link rel="apple-touch-startup-image">` tags for EVERY device size (not recommended)

#### 4. **Offline Limitations**
- ✅ Your service worker handles offline caching perfectly
- ⚠️ iOS Safari is more aggressive about clearing cache when storage is low
- 💡 Keep pre-cached files minimal (you're already doing this!)

#### 5. **PWA Updates**
- ⚠️ iOS doesn't auto-update PWAs in background
- ⚠️ Users must close and reopen the app
- ✅ Your service worker checks for updates every hour when app is open

#### 6. **Display Mode**
- ✅ `standalone` mode removes Safari UI (like a native app)
- ⚠️ iOS doesn't support `minimal-ui` or `fullscreen` modes

#### 7. **Orientation Lock**
- ✅ `"orientation": "portrait-primary"` in manifest.json
- ⚠️ iOS may ignore this - can't force orientation in web apps

#### 8. **Back Button Behavior**
- ⚠️ No back button in standalone mode - your SPA navigation must handle this
- ✅ Your app is single-page, so this works well!

#### 9. **Camera/Sensors**
- ⚠️ Limited access to device features compared to native apps
- ⚠️ No push notifications support on iOS PWAs (as of iOS 16.4+, beta support exists)

#### 10. **Testing on iOS**
```
1. Deploy to a server (localhost won't work for PWA features)
2. Open in Safari (Chrome/Firefox won't work for "Add to Home Screen")
3. Tap Share → Add to Home Screen
4. Test in standalone mode (not in Safari)
```

## 🚀 Service Worker Features

Your service worker (`sw.js`) includes:

### ✅ Pre-Caching (Installed Immediately)
- `/` and `/index.html` - Your main app
- `/translations.js` - Language files
- `/favicon.ico` and `/apple-touch-icon.png` - Icons
- Tailwind CSS CDN
- Google Fonts CSS

### ✅ Dynamic Caching (Cached as Visited)
- `/functions/api/events` - Calendar API responses
- Google Fonts WOFF2 files
- Other runtime resources

### ✅ Cache-First Strategy
- Serves from cache instantly (fast!)
- Updates cache in background when online
- Falls back to network if not in cache

### ✅ API Caching Strategy
- Returns cached events immediately (instant load!)
- Fetches fresh data in background
- Shows stale data if offline
- Returns helpful error message if no cache exists

### ✅ Cache Management
- Automatic cleanup of old cache versions
- Dynamic cache limited to 50 entries
- Manual cache control via messages

### ✅ Update Handling
- Checks for service worker updates every hour
- Logs when new version is available
- Can be extended to show user notification

## 🔧 Advanced Configuration

### Manual Cache Control

You can send messages to the service worker from your app:

```javascript
// Clear all caches
navigator.serviceWorker.controller.postMessage({
  type: 'CLEAR_CACHE'
});

// Force cache specific URLs
navigator.serviceWorker.controller.postMessage({
  type: 'CACHE_URLS',
  urls: ['/some-url.json']
});

// Force service worker update
navigator.serviceWorker.controller.postMessage({
  type: 'SKIP_WAITING'
});
```

### Background Sync (Future Enhancement)

Your service worker includes basic background sync support:

```javascript
// Register a sync event (requires browser support)
if ('sync' in registration) {
  registration.sync.register('sync-events');
}
```

This will attempt to sync calendar events when connectivity is restored.

## 📊 Testing Your PWA

### Chrome DevTools (Desktop)
1. Open DevTools (F12)
2. Go to **Application** tab
3. Check:
   - ✅ **Manifest** - Verify all fields are correct
   - ✅ **Service Workers** - Should show "activated and running"
   - ✅ **Cache Storage** - Shows cached resources
4. Test offline mode:
   - ✅ Check "Offline" in Service Workers section
   - ✅ Reload page - should work offline!

### Chrome DevTools - Lighthouse
1. Open DevTools → **Lighthouse** tab
2. Select "Progressive Web App"
3. Click "Generate report"
4. Aim for 100% PWA score!

### Android Testing
1. Deploy to HTTPS domain (required for PWA)
2. Open in Chrome
3. Look for "Install app" banner
4. Install and test offline functionality

### iOS Testing
1. Deploy to HTTPS domain
2. Open in Safari
3. Tap Share → Add to Home Screen
4. Open from home screen
5. Enable Airplane mode and test offline

## 🌐 Deployment Notes

### Requirements
- ✅ Must be served over **HTTPS** (required for service workers)
- ✅ Service worker must be served from root domain
- ✅ All cached resources must be on same origin or CORS-enabled

### Cloudflare Pages (Your Current Setup)
- ✅ Automatic HTTPS ✓
- ✅ Service worker in root directory ✓
- ✅ Manifest in root directory ✓
- ✅ Fast CDN delivery ✓

No additional configuration needed!

### Cache Invalidation
When you update your app:
1. **Update `CACHE_VERSION` in `sw.js`** (e.g., `'v1.0.1'`)
2. Deploy new version
3. Old caches will be automatically deleted
4. Users will get the update within 1 hour or on next app restart

## 🎯 Best Practices

### ✅ Already Implemented
- Pre-cache critical resources (HTML, CSS, JS)
- Cache-first strategy for fast loads
- Background updates for fresh content
- Fallback for offline API requests
- Version-based cache management
- Safe area insets for iOS notch
- Proper iOS meta tags

### 🚀 Optional Enhancements
- Show "Update Available" notification to users
- Add "Install App" banner for Android users
- Implement offline queue for form submissions
- Add custom offline page with helpful message
- Track PWA analytics (install events, usage stats)

## 📝 Manifest.json Configuration

Your manifest includes:

```json
{
  "name": "School Schedule Calendar",           // Full app name
  "short_name": "Schedule",                    // Home screen name (max 12 chars)
  "start_url": "/",                            // Default start page
  "display": "standalone",                     // Fullscreen without browser UI
  "background_color": "#1e293b",              // Splash screen background
  "theme_color": "#1e293b",                   // Status bar color
  "orientation": "portrait-primary"           // Portrait orientation
}
```

### Customization Options

You can modify `manifest.json` to:
- Change app name/short name
- Adjust colors (background_color, theme_color)
- Add more shortcuts
- Include screenshots for app stores
- Change display mode (standalone, fullscreen, minimal-ui)

## 🐛 Troubleshooting

### Service Worker Not Registering
- Check browser console for errors
- Verify HTTPS (required for service workers)
- Check that `sw.js` is served from root domain
- Clear browser cache and try again

### Icons Not Showing
- Verify icon files exist in root directory
- Check file names match manifest.json
- Hard refresh (Ctrl+Shift+R)
- Check browser DevTools → Application → Manifest

### Offline Mode Not Working
- Check Service Worker is activated (DevTools → Application)
- Verify resources are in cache (DevTools → Cache Storage)
- Test with DevTools offline mode first
- Check for CORS errors in console

### iOS Not Showing "Add to Home Screen"
- Must use Safari (not Chrome)
- Must be on HTTPS domain (not localhost)
- Icon must be available at specified path
- Try visiting multiple pages first

## 🎉 Summary

Your calendar is now a **fully offline-ready PWA**! Here's what works:

✅ **Offline-First**: Loads instantly from cache, updates in background
✅ **Installable**: Add to home screen on Android and iOS
✅ **App-Like**: Standalone mode, no browser UI
✅ **Auto-Updates**: Checks for updates every hour
✅ **Smart Caching**: API responses cached for offline access
✅ **iOS Optimized**: Safe areas, status bar, splash screen
✅ **Fast**: Cache-first strategy for instant loads

### Next Steps
1. Generate the missing icon sizes (see "Required Icons" section)
2. Deploy to your HTTPS domain
3. Test installation on Android and iOS
4. Enjoy your offline-ready calendar app! 🎊

---

**Need help?** Check browser console for service worker logs (look for ✅ 🔄 ❌ emojis).
