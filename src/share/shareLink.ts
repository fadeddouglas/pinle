import { SITE_HOST } from '../game/physics.ts'
import { createHole } from '../game/seed.ts'
import type { Hole, Lie, ShotResult } from '../game/types.ts'

const LIES: Lie[] = ['green', 'fairway', 'bunker', 'water', 'rough']

export type ShareShot = {
  f: number
  a: boolean
  l: Lie
  x: number
  y: number
}

export type ShareCard = {
  k: string
  n: number
  y: number
  s: ShareShot[]
}

export const SITE_ORIGIN = 'https://pinle.io'

function roundCoord(value: number): number {
  return Math.round(value * 1000) / 1000
}

export function shotsToShare(results: ShotResult[]): ShareShot[] {
  return results.slice(0, 3).map((shot) => ({
    f: Math.round(shot.distanceFeet * 10) / 10,
    a: shot.ace,
    l: shot.lie,
    x: roundCoord(shot.rest.x),
    y: roundCoord(shot.rest.y),
  }))
}

export function shareToShotResults(shots: ShareShot[]): ShotResult[] {
  return shots.map((shot) => ({
    path: [],
    rest: { x: shot.x, y: shot.y },
    distanceYards: shot.f / 3,
    distanceFeet: shot.f,
    ace: shot.a,
    lie: shot.l,
    clubId: '9i',
    power: 0,
    aimDeg: 0,
    backspin: 0,
    sidespin: 0,
  }))
}

export function encodeShareCard(hole: Hole, results: ShotResult[]): string {
  const card: ShareCard = {
    k: hole.dayKey,
    n: hole.puzzleNumber,
    y: hole.yards,
    s: shotsToShare(results),
  }
  const json = JSON.stringify(card)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string): string | null {
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/')
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
    const binary = atob(padded + pad)
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

function isLie(value: unknown): value is Lie {
  return typeof value === 'string' && (LIES as string[]).includes(value)
}

export function decodeShareCard(raw: string): ShareCard | null {
  const json = fromBase64Url(raw)
  if (!json) {
    return null
  }
  try {
    const parsed = JSON.parse(json) as Partial<ShareCard>
    if (typeof parsed.k !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(parsed.k)) {
      return null
    }
    if (typeof parsed.n !== 'number' || typeof parsed.y !== 'number' || !Array.isArray(parsed.s)) {
      return null
    }
    if (parsed.s.length < 1 || parsed.s.length > 3) {
      return null
    }
    const shots: ShareShot[] = []
    for (const shot of parsed.s) {
      if (
        typeof shot?.f !== 'number' ||
        typeof shot.a !== 'boolean' ||
        !isLie(shot.l) ||
        typeof shot.x !== 'number' ||
        typeof shot.y !== 'number'
      ) {
        return null
      }
      shots.push({ f: shot.f, a: shot.a, l: shot.l, x: shot.x, y: shot.y })
    }
    return { k: parsed.k, n: parsed.n, y: parsed.y, s: shots }
  } catch {
    return null
  }
}

export function holeFromShare(card: ShareCard): Hole {
  const ms = Date.parse(`${card.k}T12:00:00.000Z`)
  return createHole(Number.isFinite(ms) ? ms : Date.now())
}

export function shareUrl(hole: Hole, results: ShotResult[], origin = SITE_ORIGIN): string {
  const token = encodeShareCard(hole, results)
  return `${origin.replace(/\/$/, '')}/?r=${token}`
}

export function readShareParam(search = typeof window === 'undefined' ? '' : window.location.search): string | null {
  const value = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('r')
  return value && value.length > 0 ? value : null
}

export function pageOrigin(): string {
  if (typeof window === 'undefined') {
    return SITE_ORIGIN
  }
  const origin = window.location.origin
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return origin
  }
  return SITE_ORIGIN
}

export function shareTextWithLink(scoreText: string, url: string): string {
  const trimmed = scoreText.replace(new RegExp(`\\n${SITE_HOST}$`), '')
  return `${trimmed}\n${url}`
}
