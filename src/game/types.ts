export type Vec2 = {
  x: number
  y: number
}

export type Vec3 = {
  x: number
  y: number
  z: number
}

export type Club = {
  id: string
  name: string
  loftDeg: number
  maxCarryYards: number
  roll: number
}

export type Tree = {
  x: number
  y: number
  height: number
  radius: number
}

export type Hill = {
  x: number
  y: number
  radius: number
  height: number
}

export type Hole = {
  dayKey: string
  puzzleNumber: number
  yards: number
  pinX: number
  greenRadius: number
  greenLift: number
  windSpeedMph: number
  windAngleRad: number
  bunker: { x: number; y: number; r: number } | null
  water: { x: number; y: number; w: number; h: number } | null
  trees: Tree[]
  hills: Hill[]
}

export type Lie = 'green' | 'fairway' | 'bunker' | 'water' | 'rough'

export type ShotInput = {
  clubId: string
  power: number
  aimDeg: number
  backspin: number
  sidespin: number
}

export type ShotResult = {
  path: Vec3[]
  rest: Vec2
  distanceYards: number
  distanceFeet: number
  ace: boolean
  lie: Lie
  clubId: string
  power: number
  aimDeg: number
  backspin: number
  sidespin: number
}

export type SavedDay = {
  dayKey: string
  results: ShotResult[]
}
