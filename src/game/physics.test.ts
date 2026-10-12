import { describe, expect, it } from 'vitest'
import {
  CUP_RADIUS_FEET,
  CUP_RADIUS_YARDS,
  bestShot,
  capturedByCup,
  formatRoundShareText,
  formatShareText,
  isAce,
  simulateShot,
} from './physics.ts'
import { createHole } from './seed.ts'
import type { Hole, ShotInput } from './types.ts'

function holeWithoutHazards(): Hole {
  const hole = createHole(Date.UTC(2026, 9, 20, 16))
  return { ...hole, bunker: null, water: null, pinX: 0, yards: 150, greenRadius: 14 }
}

const baseShot: ShotInput = {
  clubId: '8i',
  power: 0.92,
  aimDeg: 0,
  backspin: 0.35,
  sidespin: 0,
}

describe('shot physics', () => {
  it('pushes the ball farther with a tailwind than a headwind', () => {
    const hole = holeWithoutHazards()
    const tail = simulateShot(baseShot, { ...hole, windSpeedMph: 18, windAngleRad: 0 })
    const head = simulateShot(baseShot, { ...hole, windSpeedMph: 18, windAngleRad: Math.PI })
    expect(tail.rest.y).toBeGreaterThan(head.rest.y)
  })

  it('moves a fade to the right of a draw', () => {
    const hole = holeWithoutHazards()
    const fade = simulateShot({ ...baseShot, sidespin: 0.85 }, hole)
    const draw = simulateShot({ ...baseShot, sidespin: -0.85 }, hole)
    expect(fade.rest.x).toBeGreaterThan(draw.rest.x)
  })

  it('checks up more with extra backspin', () => {
    const hole = holeWithoutHazards()
    const spinny = simulateShot({ ...baseShot, clubId: 'pw', power: 1, backspin: 1 }, hole)
    const runner = simulateShot({ ...baseShot, clubId: 'pw', power: 1, backspin: 0 }, hole)
    expect(runner.rest.y).toBeGreaterThan(spinny.rest.y)
  })

  it('counts an ace only when the ball is in the 4.25 inch cup', () => {
    expect(isAce('green', 0)).toBe(true)
    expect(isAce('green', CUP_RADIUS_FEET)).toBe(true)
    expect(isAce('green', CUP_RADIUS_FEET + 0.02)).toBe(false)
    expect(isAce('water', 0)).toBe(false)
  })

  it('swallows a slow roll over a regulation cup and lips out a flyer', () => {
    expect(capturedByCup(0, 0.4)).toBe(true)
    expect(capturedByCup(CUP_RADIUS_YARDS * 0.4, 0.8)).toBe(true)
    expect(capturedByCup(CUP_RADIUS_YARDS * 1.01, 0.1)).toBe(false)
    expect(capturedByCup(0, 8)).toBe(false)
  })
})

describe('share copy', () => {
  it('does not use Wordle-style guess grids', () => {
    const text = formatShareText(47, { distanceFeet: 4.2, ace: false, lie: 'green' })
    expect(text).toContain('PINLE #47')
    expect(text).toContain('FROM THE STICK')
    expect(text).toContain('pinle.io')
    expect(text).not.toMatch(/[🟩🟨⬜]/u)
    expect(text.toLowerCase()).not.toContain('wordle')
    expect(text).not.toMatch(/\d\/6/)
  })

  it('shares three looks without a Wordle grid', () => {
    const text = formatRoundShareText(47, [
      { distanceFeet: 12, ace: false, lie: 'green' },
      { distanceFeet: 4.2, ace: false, lie: 'green' },
      { distanceFeet: 80, ace: false, lie: 'water' },
    ])
    expect(text).toContain('PINLE #47')
    expect(text).toContain('BEST')
    expect(text).toContain('pinle.io')
    expect(text).not.toMatch(/[🟩🟨⬜]/u)
    expect(bestShot([
      { distanceFeet: 12, ace: false, lie: 'green' },
      { distanceFeet: 4.2, ace: false, lie: 'green' },
    ]).distanceFeet).toBe(4.2)
  })
})
