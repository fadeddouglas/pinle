import type { SavedDay, ShotResult } from './game/types.ts'

const KEY = 'pinle-release-1'
const LEGACY_KEYS = ['pinle-v1', 'pinle-v2']

function stripPath(result: ShotResult): ShotResult {
  return { ...result, path: [] }
}

function dropLegacySaves(): void {
  for (const key of LEGACY_KEYS) {
    localStorage.removeItem(key)
  }
}

export function loadSavedDay(): SavedDay | null {
  try {
    dropLegacySaves()
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as SavedDay & { result?: ShotResult }
    if (Array.isArray(parsed.results)) {
      return { dayKey: parsed.dayKey, results: parsed.results }
    }
    if (parsed.result) {
      return { dayKey: parsed.dayKey, results: [parsed.result] }
    }
    return null
  } catch {
    return null
  }
}

export function saveDay(value: SavedDay): void {
  localStorage.setItem(KEY, JSON.stringify({
    dayKey: value.dayKey,
    results: value.results.map(stripPath),
  }))
}

export function clearSavedDay(): void {
  localStorage.removeItem(KEY)
  dropLegacySaves()
}
