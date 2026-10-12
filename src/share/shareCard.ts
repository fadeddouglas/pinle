import { formatDistance, formatRoundShareText, formatShareText } from '../game/physics.ts'
import type { Hole, ShotResult } from '../game/types.ts'

function fillStroke(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fill: string,
  stroke = '#111111',
  width = 10,
) {
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2
  ctx.lineWidth = width
  ctx.strokeStyle = stroke
  ctx.fillStyle = fill
  ctx.strokeText(text, x, y)
  ctx.fillText(text, x, y)
}

export async function drawShareCard(hole: Hole, result: ShotResult): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 900
  canvas.height = 1120
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas is unavailable')
  }

  await document.fonts.ready

  const sky = ctx.createLinearGradient(0, 0, 0, 1120)
  sky.addColorStop(0, '#4eb7ff')
  sky.addColorStop(0.45, '#8fd3ff')
  sky.addColorStop(0.45, '#2f9a4a')
  sky.addColorStop(1, '#145c28')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, 900, 1120)

  ctx.textAlign = 'center'
  ctx.font = '92px Anton, sans-serif'
  fillStroke(ctx, 'PINLE', 450, 140, '#ffe14a', '#111', 16)

  ctx.font = '48px Anton, sans-serif'
  fillStroke(ctx, `#${hole.puzzleNumber}`, 450, 210, '#ffffff', '#111', 10)

  ctx.font = '72px Anton, sans-serif'
  const headline = result.ace ? 'ACE' : formatDistance(result.distanceFeet, false)
  fillStroke(ctx, headline, 450, 340, result.ace ? '#ffe14a' : '#ffffff', '#111', 14)

  ctx.font = '36px Anton, sans-serif'
  fillStroke(ctx, `${hole.yards} YD PAR 3`, 450, 410, '#ffffff', '#111', 8)

  const pinX = 450 + hole.pinX * 8
  const pinY = 820
  const teeY = 1020
  ctx.strokeStyle = '#0d3d18'
  ctx.lineWidth = 18
  ctx.beginPath()
  ctx.moveTo(450, teeY)
  ctx.quadraticCurveTo(450 + result.rest.x * 4, 900, 450 + result.rest.x * 8, 760)
  ctx.stroke()

  ctx.fillStyle = '#1f7a3a'
  ctx.beginPath()
  ctx.ellipse(pinX, pinY, 90, 36, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#3a3428'
  ctx.beginPath()
  ctx.ellipse(pinX, pinY, 16, 7, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#111'
  ctx.beginPath()
  ctx.ellipse(pinX, pinY, 12, 5, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#111'
  ctx.fillRect(pinX - 3, pinY - 90, 6, 90)
  ctx.fillStyle = '#e10600'
  ctx.beginPath()
  ctx.moveTo(pinX + 3, pinY - 88)
  ctx.lineTo(pinX + 58, pinY - 70)
  ctx.lineTo(pinX + 3, pinY - 52)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(450 + result.rest.x * 8, 760, 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#111'
  ctx.lineWidth = 4
  ctx.stroke()

  ctx.font = '28px Anton, sans-serif'
  fillStroke(ctx, 'ONE SHOT. CLOSEST TO THE PIN.', 450, 1080, '#fff', '#111', 8)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) {
        resolve(value)
      } else {
        reject(new Error('Could not build share image'))
      }
    }, 'image/png')
  })
  return blob
}

function downloadCard(blob: Blob, puzzle: number): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `pinle-${puzzle}.png`
  link.click()
  URL.revokeObjectURL(url)
}

export async function shareResult(
  hole: Hole,
  result: ShotResult,
  round?: ShotResult[],
): Promise<string> {
  const text =
    round && round.length > 1
      ? formatRoundShareText(hole.puzzleNumber, round)
      : formatShareText(hole.puzzleNumber, result)
  const blob = await drawShareCard(hole, result)
  const file = new File([blob], `pinle-${hole.puzzleNumber}.png`, { type: 'image/png' })

  if (navigator.share && navigator.canShare?.({ files: [file], text })) {
    await navigator.share({ files: [file], text, title: `PINLE #${hole.puzzleNumber}` })
    return 'shared'
  }

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
        'text/plain': new Blob([text], { type: 'text/plain' }),
      }),
    ])
    return 'copied-image'
  } catch {
    try {
      await navigator.clipboard.writeText(text)
      downloadCard(blob, hole.puzzleNumber)
      return 'copied-text'
    } catch {
      downloadCard(blob, hole.puzzleNumber)
      return 'downloaded'
    }
  }
}
