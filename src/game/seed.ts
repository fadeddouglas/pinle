import type { Hole } from './types.ts'

export const PINLE_EPOCH_UTC = Date.UTC(2026, 9, 11)

export function utcDayKey(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10)
}

export function puzzleNumber(now = Date.now()): number {
  const dayStart = Date.UTC(
    new Date(now).getUTCFullYear(),
    new Date(now).getUTCMonth(),
    new Date(now).getUTCDate(),
  )
  return Math.floor((dayStart - PINLE_EPOCH_UTC) / 86_400_000) + 1
}

export function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function mulberry32(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function createHole(now = Date.now()): Hole {
  const dayKey = utcDayKey(now)
  const rng = mulberry32(hashString(`pinle:${dayKey}`))
  const yards = 125 + Math.floor(rng() * 65)
  const pinX = (rng() - 0.5) * 16
  const windSpeedMph = 2 + rng() * 16
  const windAngleRad = rng() * Math.PI * 2
  const greenRadius = 11 + rng() * 6
  const bunker =
    rng() > 0.28
      ? {
          x: pinX + (rng() > 0.5 ? -1 : 1) * (greenRadius + 4 + rng() * 6),
          y: yards - 8 + rng() * 10,
          r: 4 + rng() * 3,
        }
      : null
  const water =
    rng() > 0.55
      ? {
          x: (rng() > 0.5 ? -22 : 8) + rng() * 6,
          y: yards * (0.35 + rng() * 0.25),
          w: 16 + rng() * 10,
          h: 10 + rng() * 8,
        }
      : null

  const hills = Array.from({ length: 4 + Math.floor(rng() * 3) }, () => {
    const side = rng() > 0.5 ? 1 : -1
    return {
      x: side * (22 + rng() * 28),
      y: 18 + rng() * (yards + 10),
      radius: 10 + rng() * 14,
      height: 1.6 + rng() * 3.4,
    }
  })
  hills.push({
    x: pinX * 0.3,
    y: yards + 18,
    radius: 16 + rng() * 8,
    height: 2.2 + rng() * 2,
  })

  const trees = Array.from({ length: 14 + Math.floor(rng() * 8) }, () => {
    const side = rng() > 0.5 ? 1 : -1
    return {
      x: side * (20 + rng() * 36),
      y: 8 + rng() * (yards + 28),
      height: 4.5 + rng() * 6,
      radius: 1.6 + rng() * 1.4,
    }
  })

  return {
    dayKey,
    puzzleNumber: puzzleNumber(now),
    yards,
    pinX,
    greenRadius,
    greenLift: 0.7 + rng() * 0.8,
    windSpeedMph,
    windAngleRad,
    bunker,
    water,
    trees,
    hills,
  }
}

export function terrainHeight(x: number, y: number, hole: Hole): number {
  let z = 0
  for (const hill of hole.hills) {
    const d = Math.hypot(x - hill.x, y - hill.y) / hill.radius
    if (d < 1) {
      z += hill.height * (1 - d) * (1 - d)
    }
  }
  const toPin = Math.hypot(x - hole.pinX, y - hole.yards) / hole.greenRadius
  if (toPin < 1.2) {
    z += hole.greenLift * (1 - Math.min(1, toPin / 1.2))
  }
  return z
}

export function windVector(hole: Hole): { x: number; y: number } {
  return {
    x: Math.sin(hole.windAngleRad) * hole.windSpeedMph,
    y: Math.cos(hole.windAngleRad) * hole.windSpeedMph,
  }
}

export function windLabel(hole: Hole): string {
  const deg = ((hole.windAngleRad * 180) / Math.PI + 360) % 360
  const dirs = ['TAIL', 'R-TAIL', 'RIGHT', 'R-HEAD', 'HEAD', 'L-HEAD', 'LEFT', 'L-TAIL']
  const idx = Math.round(deg / 45) % 8
  return `${dirs[idx]} ${Math.round(hole.windSpeedMph)} MPH`
}
