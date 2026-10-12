import type { Club } from './types.ts'

export const CLUBS: readonly Club[] = [
  { id: 'sw', name: 'SW', loftDeg: 56, maxCarryYards: 95, roll: 0.08 },
  { id: 'pw', name: 'PW', loftDeg: 46, maxCarryYards: 120, roll: 0.12 },
  { id: '9i', name: '9I', loftDeg: 41, maxCarryYards: 135, roll: 0.15 },
  { id: '8i', name: '8I', loftDeg: 37, maxCarryYards: 148, roll: 0.18 },
  { id: '7i', name: '7I', loftDeg: 34, maxCarryYards: 160, roll: 0.22 },
  { id: '6i', name: '6I', loftDeg: 31, maxCarryYards: 172, roll: 0.26 },
  { id: '5i', name: '5I', loftDeg: 27, maxCarryYards: 185, roll: 0.3 },
  { id: 'hy', name: 'HY', loftDeg: 21, maxCarryYards: 205, roll: 0.34 },
  { id: 'dr', name: 'DR', loftDeg: 10.5, maxCarryYards: 250, roll: 0.4 },
]

export function getClub(id: string): Club {
  const club = CLUBS.find((item) => item.id === id)
  if (!club) {
    return CLUBS[4]
  }
  return club
}

export function recommendedClubId(yards: number): string {
  let best = CLUBS[0]
  let bestGap = Math.abs(best.maxCarryYards - yards)
  for (const club of CLUBS) {
    const gap = Math.abs(club.maxCarryYards - yards)
    if (gap < bestGap) {
      best = club
      bestGap = gap
    }
  }
  return best.id
}
