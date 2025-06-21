// Script to generate PWA icons from SVG
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Simple SVG icon for mood tracking
const iconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="256" cy="256" r="240" fill="#4F46E5" stroke="#ffffff" stroke-width="16"/>
  
  <!-- Face outline -->
  <circle cx="256" cy="256" r="180" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round"/>
  
  <!-- Eyes -->
  <circle cx="200" cy="220" r="16" fill="#ffffff"/>
  <circle cx="312" cy="220" r="16" fill="#ffffff"/>
  
  <!-- Smile -->
  <path d="M180 300 Q256 360 332 300" stroke="#ffffff" stroke-width="16" stroke-linecap="round" fill="none"/>
  
  <!-- Chart elements (representing mood tracking) -->
  <rect x="140" y="380" width="12" height="40" fill="#ffffff" opacity="0.8"/>
  <rect x="160" y="360" width="12" height="60" fill="#ffffff" opacity="0.8"/>
  <rect x="180" y="340" width="12" height="80" fill="#ffffff" opacity="0.8"/>
  <rect x="320" y="370" width="12" height="50" fill="#ffffff" opacity="0.8"/>
  <rect x="340" y="350" width="12" height="70" fill="#ffffff" opacity="0.8"/>
  <rect x="360" y="380" width="12" height="40" fill="#ffffff" opacity="0.8"/>
</svg>
`

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512]

console.log('Generating PWA icons...')
console.log('Note: This is a placeholder script.')
console.log('In production, you would use a tool like @capacitor/assets or similar to generate actual icon files.')

// Create icons directory
const iconsDir = path.join(__dirname, 'public', 'icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// Save the SVG source
fs.writeFileSync(path.join(iconsDir, 'icon-source.svg'), iconSvg)

// Create SVG files for each required size
iconSizes.forEach(size => {
  const sizedSvg = iconSvg.replace('width="512" height="512"', `width="${size}" height="${size}"`)
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), sizedSvg)
})

// Create a simple favicon.ico equivalent as SVG
const faviconSvg = iconSvg.replace('width="512" height="512"', 'width="32" height="32"')
fs.writeFileSync(path.join(__dirname, 'public', 'favicon.svg'), faviconSvg)

console.log('✓ SVG icons created for all required sizes')
console.log('✓ Favicon SVG created')
console.log('Note: For production, you may want to convert SVGs to PNG using a tool like sharp or imagemagick')