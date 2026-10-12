import type { SavedDay, ShotResult } from './game/types.ts'

const KEY = 'pinle-v2'

function stripPath(result: ShotResult): ShotResult {
  return { ...result, path: [] }
}

export function loadSavedDay(): SavedDay | null {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem('pinle-v1')
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
  localStorage.removeItem('pinle-v1')
}
