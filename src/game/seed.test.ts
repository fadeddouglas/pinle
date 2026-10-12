import { describe, expect, it } from 'vitest'
import { createHole, puzzleNumber, utcDayKey } from './seed.ts'

describe('daily hole seed', () => {
  it('uses a UTC day key', () => {
    expect(utcDayKey(Date.UTC(2026, 9, 12, 3, 0, 0))).toBe('2026-10-12')
    expect(utcDayKey(Date.UTC(2026, 9, 12, 23, 50, 0))).toBe('2026-10-12')
  })

  it('numbers puzzles from the Pinle epoch', () => {
    expect(puzzleNumber(Date.UTC(2026, 9, 12, 12))).toBe(1)
    expect(puzzleNumber(Date.UTC(2026, 9, 13, 12))).toBe(2)
  })

  it('builds the same hole for the same instant', () => {
    const now = Date.UTC(2026, 9, 15, 18)
    expect(createHole(now)).toEqual(createHole(now))
  })

  it('plants trees and hills off the landing strip', () => {
    const hole = createHole(Date.UTC(2026, 9, 15, 18))
    expect(hole.trees.length).toBeGreaterThan(8)
    expect(hole.hills.length).toBeGreaterThan(3)
    expect(hole.trees.every((tree) => Math.abs(tree.x) >= 18)).toBe(true)
  })

  it('changes the hole across UTC days', () => {
    const a = createHole(Date.UTC(2026, 9, 15, 18))
    const b = createHole(Date.UTC(2026, 9, 16, 18))
    expect(a.dayKey).not.toBe(b.dayKey)
    expect(a.yards !== b.yards || a.pinX !== b.pinX || a.windAngleRad !== b.windAngleRad).toBe(
      true,
    )
  })
})
