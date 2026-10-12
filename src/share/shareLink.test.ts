import { describe, expect, it } from 'vitest'
import { createHole } from '../game/seed.ts'
import type { ShotResult } from '../game/types.ts'
import { decodeShareCard, encodeShareCard, holeFromShare, shareToShotResults, shareUrl } from './shareLink.ts'

const sample: ShotResult = {
  path: [],
  rest: { x: 2.5, y: 138.2 },
  distanceYards: 4,
  distanceFeet: 12,
  ace: false,
  lie: 'green',
  clubId: '9i',
  power: 0.8,
  aimDeg: 0,
  backspin: 0.4,
  sidespin: 0,
}

describe('share links', () => {
  it('round-trips a card so a friend can open the same score', () => {
    const hole = createHole(Date.UTC(2026, 9, 12, 16))
    const token = encodeShareCard(hole, [sample, { ...sample, ace: true, distanceFeet: 0, lie: 'green' }])
    const card = decodeShareCard(token)
    expect(card?.k).toBe(hole.dayKey)
    expect(card?.n).toBe(hole.puzzleNumber)
    expect(card?.s).toHaveLength(2)
    expect(card?.s[1].a).toBe(true)
    const restored = shareToShotResults(card!.s)
    expect(restored[0].distanceFeet).toBe(12)
    expect(holeFromShare(card!).dayKey).toBe(hole.dayKey)
  })

  it('builds a pinle.io link', () => {
    const hole = createHole(Date.UTC(2026, 9, 12, 16))
    const url = shareUrl(hole, [sample])
    expect(url.startsWith('https://pinle.io/?r=')).toBe(true)
    expect(decodeShareCard(url.split('r=')[1])).not.toBeNull()
  })

  it('rejects junk', () => {
    expect(decodeShareCard('not-a-card')).toBeNull()
  })
})
