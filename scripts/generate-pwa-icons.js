#!/usr/bin/env node
/**
 * PWA Icon Generation Script
 * 
 * This script generates all required PWA icons from a source image or creates placeholders.
 * 
 * Usage:
 *   node scripts/generate-pwa-icons.js [sourceImagePath]
 * 
 * Example:
 *   node scripts/generate-pwa-icons.js public/logo-512.png
 * 
 * If no source image is provided, it creates placeholder gradient icons.
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let useSharp = false;
let sharp;
try {
  sharp = require('sharp');
  useSharp = true;
  console.log('✓ Using sharp for image processing');
} catch {
  console.log('⚠ Sharp not available. Install it with: npm install --save-dev sharp');
  console.log('  Creating placeholder icons with SVG...\n');
}

const pwaIconsDir = path.join(__dirname, '../public/pwa-icons');

// Ensure directory exists
if (!fs.existsSync(pwaIconsDir)) {
  fs.mkdirSync(pwaIconsDir, { recursive: true });
  console.log(`Created directory: ${pwaIconsDir}\n`);
}

// Icon sizes to generate
const iconSizes = [
  { size: 72, name: 'icon-72x72' },
  { size: 96, name: 'icon-96x96' },
  { size: 128, name: 'icon-128x128' },
  { size: 144, name: 'icon-144x144' },
  { size: 152, name: 'icon-152x152' },
  { size: 192, name: 'icon-192x192' },
  { size: 384, name: 'icon-384x384' },
  { size: 512, name: 'icon-512x512' },
];

// Maskable icon sizes
const maskableIconSizes = [
  { size: 192, name: 'icon-192x192-maskable' },
  { size: 512, name: 'icon-512x512-maskable' },
];

// Shortcut icons
const shortcutIcons = [
  { size: 192, name: 'shortcut-venues', color: '#ec4899' },
  { size: 192, name: 'shortcut-catering', color: '#f59e0b' },
  { size: 192, name: 'shortcut-bookings', color: '#3b82f6' },
  { size: 192, name: 'shortcut-wishlist', color: '#ef4444' },
];

async function generatePlaceholderSVG(size, name, color = '#ec4899') {
  const svgContent = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#9333ea;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad1)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.round(size * 0.3)}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">BMV</text>
</svg>
  `.trim();

  const outputPath = path.join(pwaIconsDir, `${name}.svg`);
  fs.writeFileSync(outputPath, svgContent, 'utf-8');
  console.log(`  ✓ Created SVG: ${name}.svg`);

  // Convert SVG to PNG using sharp if available
  if (useSharp) {
    try {
      const pngPath = path.join(pwaIconsDir, `${name}.png`);
      await sharp(Buffer.from(svgContent))
        .png()
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .toFile(pngPath);
      console.log(`  ✓ Created PNG: ${name}.png`);
    } catch (error) {
      console.error(`  ✗ Failed to create PNG: ${name}.png - ${error.message}`);
    }
  }
}

async function generateIconFromSource(sourceImagePath) {
  if (!useSharp) {
    console.error('Sharp is required to process source images.');
    console.error('Install it with: npm install --save-dev sharp\n');
    return false;
  }

  if (!fs.existsSync(sourceImagePath)) {
    console.error(`Source image not found: ${sourceImagePath}\n`);
    return false;
  }

  console.log(`Processing source image: ${sourceImagePath}\n`);

  try {
    // Generate regular icons
    console.log('Generating regular icons...');
    for (const { size, name } of iconSizes) {
      const outputPath = path.join(pwaIconsDir, `${name}.png`);
      await sharp(sourceImagePath)
        .resize(size, size, { fit: 'cover', position: 'center' })
        .png()
        .toFile(outputPath);
      console.log(`  ✓ Created: ${name}.png (${size}x${size})`);
    }

    // Generate maskable icons (for adaptive icons on Android)
    console.log('\nGenerating maskable icons...');
    for (const { size, name } of maskableIconSizes) {
      const outputPath = path.join(pwaIconsDir, `${name}.png`);
      await sharp(sourceImagePath)
        .resize(Math.round(size * 0.8), Math.round(size * 0.8), { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .extend({
          top: Math.round(size * 0.1),
          bottom: Math.round(size * 0.1),
          left: Math.round(size * 0.1),
          right: Math.round(size * 0.1),
          background: { r: 236, g: 72, b: 153, alpha: 1 }, // Pink - match theme
        })
        .png()
        .toFile(outputPath);
      console.log(`  ✓ Created: ${name}.png (${size}x${size})`);
    }

    return true;
  } catch (error) {
    console.error(`Error processing source image: ${error.message}\n`);
    return false;
  }
}

async function generateShortcutIcons() {
  console.log('Generating shortcut icons...');

  for (const { size, name, color } of shortcutIcons) {
    await generatePlaceholderSVG(size, name, color);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   PWA Icon Generation Script');
  console.log('═══════════════════════════════════════════════════════════\n');

  const sourceImagePath = process.argv[2];

  try {
    if (sourceImagePath) {
      // Use source image
      const success = await generateIconFromSource(sourceImagePath);
      if (!success) {
        console.log('\nFalling back to placeholder icons...\n');
        for (const { size, name } of iconSizes) {
          await generatePlaceholderSVG(size, name);
        }
        for (const { size, name } of maskableIconSizes) {
          await generatePlaceholderSVG(size, name);
        }
      }
    } else {
      // Generate placeholder icons
      console.log('Generating placeholder icons...\n');
      for (const { size, name } of iconSizes) {
        await generatePlaceholderSVG(size, name);
      }
      for (const { size, name } of maskableIconSizes) {
        await generatePlaceholderSVG(size, name);
      }
    }

    // Always generate shortcut icons
    await generateShortcutIcons();

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✓ PWA icon generation complete!');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('Next steps:');
    console.log('1. Icons are ready in: public/pwa-icons/');
    console.log('2. Test PWA installation:');
    console.log('   - Deploy to HTTPS domain');
    console.log('   - Open in Chrome/Edge on Android');
    console.log('   - Look for "Install" button in address bar');
    console.log('3. For iOS: Use "Add to Home Screen" in Safari');
    console.log('4. For production: Optimize images\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
