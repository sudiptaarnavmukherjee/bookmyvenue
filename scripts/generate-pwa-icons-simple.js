#!/usr/bin/env node
/**
 * Quick PWA Icon Generator - Creates placeholder icons
 * This creates simple SVG icons that can be used immediately
 */

const fs = require('fs');
const path = require('path');

const pwaIconsDir = path.join(__dirname, '../public/pwa-icons');

// Ensure directory exists
if (!fs.existsSync(pwaIconsDir)) {
  fs.mkdirSync(pwaIconsDir, { recursive: true });
  console.log(`✓ Created directory: ${pwaIconsDir}\n`);
}

function createSVGIcon(size, fileName, color = '#ec4899', text = 'BMV') {
  const filePath = path.join(pwaIconsDir, `${fileName}.svg`);
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-${fileName}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#9333ea;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad-${fileName})"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.round(size * 0.35)}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
</svg>`;

  fs.writeFileSync(filePath, svg, 'utf-8');
  return filePath;
}

function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   PWA Icon Generator - Quick Setup');
  console.log('═══════════════════════════════════════════════════════════\n');

  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const maskableSizes = [192, 512];

  console.log('Generating regular icons...\n');
  for (const size of sizes) {
    createSVGIcon(size, `icon-${size}x${size}`);
    console.log(`✓ Created: icon-${size}x${size}.svg`);
  }

  console.log('\nGenerating maskable icons...\n');
  for (const size of maskableSizes) {
    createSVGIcon(size, `icon-${size}x${size}-maskable`);
    console.log(`✓ Created: icon-${size}x${size}-maskable.svg`);
  }

  // Shortcut icons with specific purposes
  console.log('\nGenerating shortcut icons...\n');
  const shortcuts = [
    { name: 'shortcut-venues', color: '#ec4899', text: '🏛️' },
    { name: 'shortcut-catering', color: '#f59e0b', text: '🍽️' },
    { name: 'shortcut-bookings', color: '#3b82f6', text: '📅' },
    { name: 'shortcut-wishlist', color: '#ef4444', text: '❤️' },
  ];

  for (const shortcut of shortcuts) {
    createSVGIcon(192, shortcut.name, shortcut.color, shortcut.text);
    console.log(`✓ Created: ${shortcut.name}.svg`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✓ PWA icons generated successfully!');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📝 Next Steps:\n');
  console.log('1. Icons created as SVG format (works in modern browsers)\n');
  console.log('2. For production PNG icons (recommended):');
  console.log('   npm install --save-dev sharp');
  console.log('   npm run pwa:icons\n');
  console.log('3. Then test the PWA:');
  console.log('   npm run dev\n');
  console.log('4. Testing on devices:');
  console.log('   • Android: Open Chrome → Look for "Install" button');
  console.log('   • iOS: Safari → Share → Add to Home Screen\n');
  console.log('5. Run before production build:');
  console.log('   npm run pwa:build\n');
}

try {
  main();
  process.exit(0);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
