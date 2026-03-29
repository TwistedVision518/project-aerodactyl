import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import sharp from 'sharp'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const resRoot = resolve(root, 'android/app/src/main/res')
const logoSvgPath = resolve(root, 'public/favicon.svg')

const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
}

const foregroundSizes = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
}

const portSplashSizes = {
  'drawable-port-mdpi': [320, 480],
  'drawable-port-hdpi': [480, 800],
  'drawable-port-xhdpi': [720, 1280],
  'drawable-port-xxhdpi': [960, 1600],
  'drawable-port-xxxhdpi': [1280, 1920],
}

const landSplashSizes = {
  'drawable-land-mdpi': [480, 320],
  'drawable-land-hdpi': [800, 480],
  'drawable-land-xhdpi': [1280, 720],
  'drawable-land-xxhdpi': [1600, 960],
  'drawable-land-xxxhdpi': [1920, 1280],
}

const colors = {
  bg: '#06070d',
  bgAlt: '#11162b',
  glass: 'rgba(17, 21, 36, 0.72)',
  border: 'rgba(136, 100, 255, 0.28)',
  purple: '#863bff',
  purpleDeep: '#4f1fd8',
  cyan: '#47bfff',
  cyanSoft: '#90dcff',
}

const logoSvg = await readFile(logoSvgPath, 'utf8')
const logoDataUrl = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`

function sceneFilters() {
  return `
    <defs>
      <radialGradient id="bgRadial" cx="38%" cy="32%" r="82%">
        <stop offset="0%" stop-color="${colors.bgAlt}" />
        <stop offset="100%" stop-color="${colors.bg}" />
      </radialGradient>
      <filter id="blurHuge" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="46" />
      </filter>
      <filter id="blurSoft" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="18" />
      </filter>
    </defs>
  `
}

function shellScene(width, height) {
  return `
    <rect width="${width}" height="${height}" fill="url(#bgRadial)" />
    <ellipse cx="${width * 0.26}" cy="${height * 0.78}" rx="${width * 0.33}" ry="${height * 0.28}" fill="${colors.purple}" opacity="0.68" filter="url(#blurHuge)" />
    <ellipse cx="${width * 0.77}" cy="${height * 0.18}" rx="${width * 0.18}" ry="${height * 0.18}" fill="${colors.cyan}" opacity="0.34" filter="url(#blurHuge)" />
    <ellipse cx="${width * 0.53}" cy="${height * 0.49}" rx="${width * 0.26}" ry="${height * 0.2}" fill="${colors.purpleDeep}" opacity="0.22" filter="url(#blurHuge)" />
  `
}

function logoImage(x, y, size) {
  return `<image href="${logoDataUrl}" x="${x}" y="${y}" width="${size}" height="${size * (46 / 48)}" preserveAspectRatio="xMidYMid meet" />`
}

function iconSvg(size) {
  const inset = size * 0.06
  const panelRadius = size * 0.28
  const logoSize = size * 0.54
  const logoX = (size - logoSize) / 2
  const logoY = (size - logoSize * (46 / 48)) / 2

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${sceneFilters()}
      ${shellScene(size, size)}
      <rect x="${inset}" y="${inset}" width="${size - inset * 2}" height="${size - inset * 2}" rx="${panelRadius}" fill="${colors.glass}" stroke="${colors.border}" />
      <ellipse cx="${size * 0.5}" cy="${size * 0.52}" rx="${size * 0.18}" ry="${size * 0.18}" fill="${colors.purple}" opacity="0.38" filter="url(#blurSoft)" />
      <ellipse cx="${size * 0.62}" cy="${size * 0.44}" rx="${size * 0.11}" ry="${size * 0.11}" fill="${colors.cyanSoft}" opacity="0.42" filter="url(#blurSoft)" />
      ${logoImage(logoX, logoY, logoSize)}
    </svg>
  `
}

function foregroundSvg(size) {
  const logoSize = size * 0.64
  const logoX = (size - logoSize) / 2
  const logoY = (size - logoSize * (46 / 48)) / 2

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${sceneFilters()}
      <ellipse cx="${size * 0.5}" cy="${size * 0.52}" rx="${size * 0.2}" ry="${size * 0.2}" fill="${colors.purple}" opacity="0.42" filter="url(#blurSoft)" />
      <ellipse cx="${size * 0.6}" cy="${size * 0.42}" rx="${size * 0.12}" ry="${size * 0.12}" fill="${colors.cyanSoft}" opacity="0.4" filter="url(#blurSoft)" />
      ${logoImage(logoX, logoY, logoSize)}
    </svg>
  `
}

function splashSvg(width, height) {
  const cardWidth = width * 0.38
  const cardHeight = height * 0.2
  const cardX = (width - cardWidth) / 2
  const cardY = (height - cardHeight) / 2
  const radius = Math.max(24, Math.min(width, height) * 0.058)
  const logoSize = Math.min(width, height) * 0.2
  const logoX = (width - logoSize) / 2
  const logoY = (height - logoSize * (46 / 48)) / 2

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      ${sceneFilters()}
      ${shellScene(width, height)}
      <rect x="${cardX}" y="${cardY}" width="${cardWidth}" height="${cardHeight}" rx="${radius}" fill="rgba(17, 22, 38, 0.78)" stroke="${colors.border}" />
      <ellipse cx="${width * 0.5}" cy="${height * 0.52}" rx="${Math.min(width, height) * 0.16}" ry="${Math.min(width, height) * 0.16}" fill="${colors.purple}" opacity="0.42" filter="url(#blurSoft)" />
      <ellipse cx="${width * 0.57}" cy="${height * 0.44}" rx="${Math.min(width, height) * 0.1}" ry="${Math.min(width, height) * 0.1}" fill="${colors.cyanSoft}" opacity="0.36" filter="url(#blurSoft)" />
      ${logoImage(logoX, logoY, logoSize)}
    </svg>
  `
}

async function writePng(filePath, svgMarkup, width, height) {
  await mkdir(dirname(filePath), { recursive: true })
  const png = await sharp(Buffer.from(svgMarkup)).png().resize(width, height).toBuffer()
  await writeFile(filePath, png)
}

for (const [folder, size] of Object.entries(iconSizes)) {
  await writePng(resolve(resRoot, folder, 'ic_launcher.png'), iconSvg(size), size, size)
  await writePng(resolve(resRoot, folder, 'ic_launcher_round.png'), iconSvg(size), size, size)
}

for (const [folder, size] of Object.entries(foregroundSizes)) {
  await writePng(resolve(resRoot, folder, 'ic_launcher_foreground.png'), foregroundSvg(size), size, size)
}

for (const [folder, [width, height]] of Object.entries(portSplashSizes)) {
  await writePng(resolve(resRoot, folder, 'splash.png'), splashSvg(width, height), width, height)
}

for (const [folder, [width, height]] of Object.entries(landSplashSizes)) {
  await writePng(resolve(resRoot, folder, 'splash.png'), splashSvg(width, height), width, height)
}

await writePng(resolve(resRoot, 'drawable', 'splash.png'), splashSvg(480, 320), 480, 320)

console.log('Android launcher and splash assets generated.')
