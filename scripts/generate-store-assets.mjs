import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svgPath = join(root, 'public', 'favicon.svg')
const assetsDir = join(root, 'assets')
const publicIcons = join(root, 'public', 'icons')
const svg = await readFile(svgPath)

await mkdir(assetsDir, { recursive: true })
await mkdir(publicIcons, { recursive: true })

await sharp(svg).resize(1024, 1024).png().toFile(join(assetsDir, 'icon.png'))
await sharp(svg).resize(1024, 1024).png().toFile(join(assetsDir, 'icon-only.png'))
await sharp(svg).resize(1024, 1024).png().toFile(join(assetsDir, 'icon-foreground.png'))

const background = await sharp({
  create: { width: 1024, height: 1024, channels: 4, background: '#0d3a1c' },
})
  .png()
  .toBuffer()
await writeFile(join(assetsDir, 'icon-background.png'), background)

const splashMark = await sharp(svg).resize(720, 720).png().toBuffer()
await sharp({
  create: { width: 2732, height: 2732, channels: 4, background: '#0d3a1c' },
})
  .composite([{ input: splashMark, gravity: 'center' }])
  .png()
  .toFile(join(assetsDir, 'splash.png'))
await sharp({
  create: { width: 2732, height: 2732, channels: 4, background: '#082010' },
})
  .composite([{ input: splashMark, gravity: 'center' }])
  .png()
  .toFile(join(assetsDir, 'splash-dark.png'))

await sharp(svg).resize(180, 180).png().toFile(join(publicIcons, 'icon-180.png'))
await sharp(svg).resize(512, 512).png().toFile(join(publicIcons, 'icon-512.png'))

console.log('Wrote icon and splash sources to assets/ and public/icons/')
