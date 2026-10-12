import { getClub } from './clubs.ts'
import type { Hole, Lie, ShotInput, ShotResult, Vec2, Vec3 } from './types.ts'
import { windVector } from './seed.ts'

const GRAVITY = 12
const DT = 1 / 60
const MPH_TO_YPS = 0.489
const YARDS_TO_FEET = 3
const INCHES_PER_YARD = 36

/** USGA / R&A hole: 4.25 in diameter, at least 4 in deep. Ball is 1.68 in. */
export const CUP_DIAMETER_INCHES = 4.25
export const CUP_DEPTH_INCHES = 4
export const BALL_DIAMETER_INCHES = 1.68
export const CUP_RADIUS_YARDS = CUP_DIAMETER_INCHES / 2 / INCHES_PER_YARD
export const CUP_DEPTH_YARDS = CUP_DEPTH_INCHES / INCHES_PER_YARD
export const CUP_RADIUS_FEET = CUP_DIAMETER_INCHES / 2 / 12
/** ~3.4 mph at the center; slower near the lip, matching a real cup catch. */
const CUP_CAPTURE_SPEED = 1.52

function inRect(
  point: Vec2,
  rect: { x: number; y: number; w: number; h: number },
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.w &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.h
  )
}

function inCircle(point: Vec2, circle: { x: number; y: number; r: number }): boolean {
  const dx = point.x - circle.x
  const dy = point.y - circle.y
  return dx * dx + dy * dy <= circle.r * circle.r
}

export function lieAt(point: Vec2, hole: Hole): Lie {
  if (hole.water && inRect(point, hole.water)) {
    return 'water'
  }
  if (hole.bunker && inCircle(point, hole.bunker)) {
    return 'bunker'
  }
  const pin = { x: hole.pinX, y: hole.yards }
  if (inCircle(point, { ...pin, r: hole.greenRadius })) {
    return 'green'
  }
  const fairwayHalf = 14 + Math.max(0, 18 - point.y / 12)
  if (Math.abs(point.x) <= fairwayHalf && point.y >= -2 && point.y <= hole.yards + 22) {
    return 'fairway'
  }
  return 'rough'
}

export function distanceToPin(point: Vec2, hole: Hole): { yards: number; feet: number } {
  const yards = Math.hypot(point.x - hole.pinX, point.y - hole.yards)
  return { yards, feet: yards * YARDS_TO_FEET }
}

function closestOnSegment(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  px: number,
  py: number,
): Vec2 {
  const dx = x1 - x0
  const dy = y1 - y0
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-12) {
    return { x: x0, y: y0 }
  }
  const t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / len2))
  return { x: x0 + t * dx, y: y0 + t * dy }
}

export function capturedByCup(distYards: number, speedYardsPerSec: number): boolean {
  if (distYards > CUP_RADIUS_YARDS) {
    return false
  }
  const lip = distYards / CUP_RADIUS_YARDS
  const maxSpeed = CUP_CAPTURE_SPEED * (1.12 - 0.72 * lip)
  return speedYardsPerSec <= maxSpeed
}

export function simulateShot(input: ShotInput, hole: Hole): ShotResult {
  const club = getClub(input.clubId)
  const power = Math.min(1, Math.max(0.08, input.power))
  const wind = windVector(hole)
  const loft = ((club.loftDeg * (0.86 + 0.18 * input.backspin)) * Math.PI) / 180
  const twoTheta = Math.sin(2 * loft) || 0.5
  const launchSpeed =
    Math.sqrt((club.maxCarryYards * GRAVITY) / twoTheta) * (0.42 + 0.58 * power)

  const aim = (input.aimDeg * Math.PI) / 180
  let vx = launchSpeed * Math.cos(loft) * Math.sin(aim)
  let vy = launchSpeed * Math.cos(loft) * Math.cos(aim)
  let vz = launchSpeed * Math.sin(loft)
  let x = 0
  let y = 0
  let z = 0.05
  let airborne = true
  const path: Vec3[] = [{ x, y, z }]
  let steps = 0
  const maxSteps = 90 * 60

  let holed = false
  const sink = () => {
    x = hole.pinX
    y = hole.yards
    z = -CUP_DEPTH_YARDS * 0.55
    vx = 0
    vy = 0
    vz = 0
    airborne = false
    holed = true
    path.push({ x, y, z: 0 })
    path.push({ x, y, z: -CUP_DEPTH_YARDS * 0.28 })
    path.push({ x, y, z })
  }

  while (steps < maxSteps) {
    steps += 1
    const x0 = x
    const y0 = y
    if (airborne) {
      vx += wind.x * MPH_TO_YPS * 0.22 * DT
      vy += wind.y * MPH_TO_YPS * 0.22 * DT
      const spinYaw = input.sidespin * 0.14 * DT
      const cos = Math.cos(spinYaw)
      const sin = Math.sin(spinYaw)
      const nx = vx * cos + vy * sin
      const ny = -vx * sin + vy * cos
      vx = nx
      vy = ny
      vz -= GRAVITY * DT
      x += vx * DT
      y += vy * DT
      z += vz * DT
      if (z <= 0) {
        z = 0
        const point = { x, y }
        if (lieAt(point, hole) === 'water') {
          path.push({ x, y, z })
          break
        }
        const hit = closestOnSegment(x0, y0, x, y, hole.pinX, hole.yards)
        const cupDist = Math.hypot(hit.x - hole.pinX, hit.y - hole.yards)
        if (capturedByCup(cupDist, Math.hypot(vx, vy))) {
          sink()
          break
        }
        if (Math.abs(vz) > 3.2) {
          vz *= -0.28
          vx *= 0.74
          vy *= 0.74
        } else {
          airborne = false
          vz = 0
        }
      }
    } else {
      const point = { x, y }
      const lie = lieAt(point, hole)
      let friction = 0.985 - club.roll * 0.01
      friction -= input.backspin * 0.012
      if (lie === 'green') {
        friction -= 0.01 + input.backspin * 0.018
      } else if (lie === 'bunker') {
        friction -= 0.08
      } else if (lie === 'rough') {
        friction -= 0.04
      }
      vx *= friction
      vy *= friction
      x += vx * DT
      y += vy * DT
      z = 0
      if (lieAt({ x, y }, hole) === 'water') {
        path.push({ x, y, z: 0 })
        break
      }
      const speed = Math.hypot(vx, vy)
      const hit = closestOnSegment(x0, y0, x, y, hole.pinX, hole.yards)
      const cupDist = Math.hypot(hit.x - hole.pinX, hit.y - hole.yards)
      if (capturedByCup(cupDist, speed)) {
        sink()
        break
      }
      if (speed < 0.35) {
        break
      }
    }
    if (steps % 3 === 0) {
      path.push({ x, y, z })
    }
  }

  const rest = { x, y }
  const lie = holed ? 'green' : lieAt(rest, hole)
  const dist = holed ? { yards: 0, feet: 0 } : distanceToPin(rest, hole)
  const ace = holed || isAce(lie, dist.feet)
  path.push({ x: rest.x, y: rest.y, z: holed ? -CUP_DEPTH_YARDS * 0.55 : 0 })

  return {
    path,
    rest,
    distanceYards: dist.yards,
    distanceFeet: dist.feet,
    ace,
    lie,
    clubId: input.clubId,
    power,
    aimDeg: input.aimDeg,
    backspin: input.backspin,
    sidespin: input.sidespin,
  }
}

export function isAce(lie: Lie, feet: number): boolean {
  return lie !== 'water' && feet <= CUP_RADIUS_FEET
}

export function formatDistance(feet: number, ace: boolean): string {
  if (ace) {
    return 'ACE'
  }
  if (feet < 10) {
    return `${feet.toFixed(1)} FT`
  }
  return `${Math.round(feet)} FT`
}

export const SITE_HOST = 'pinle.io'

export function formatShareText(
  puzzle: number,
  result: Pick<ShotResult, 'distanceFeet' | 'ace' | 'lie'>,
): string {
  const lines = [`PINLE #${puzzle}`]
  if (result.ace) {
    lines.push('ACE')
  } else if (result.lie === 'water') {
    lines.push('WET')
  } else {
    lines.push(`${formatDistance(result.distanceFeet, false)} FROM THE STICK`)
  }
  lines.push(SITE_HOST)
  return lines.join('\n')
}

export function bestShot<T extends Pick<ShotResult, 'distanceFeet' | 'ace' | 'lie'>>(
  results: T[],
): T {
  return [...results].sort((a, b) => {
    if (a.ace !== b.ace) {
      return a.ace ? -1 : 1
    }
    if ((a.lie === 'water') !== (b.lie === 'water')) {
      return a.lie === 'water' ? 1 : -1
    }
    return a.distanceFeet - b.distanceFeet
  })[0]
}

export function formatRoundShareText(
  puzzle: number,
  results: Array<Pick<ShotResult, 'distanceFeet' | 'ace' | 'lie'>>,
): string {
  if (results.length <= 1) {
    return formatShareText(puzzle, results[0] ?? { distanceFeet: 0, ace: false, lie: 'fairway' })
  }
  const lines = [`PINLE #${puzzle}`]
  const marks = results.map((shot) => {
    if (shot.ace) {
      return 'ACE'
    }
    if (shot.lie === 'water') {
      return 'WET'
    }
    return formatDistance(shot.distanceFeet, false)
  })
  lines.push(marks.join(' · '))
  const best = bestShot(results)
  lines.push(`BEST ${best.ace ? 'ACE' : formatDistance(best.distanceFeet, false)}`)
  lines.push(SITE_HOST)
  return lines.join('\n')
}
