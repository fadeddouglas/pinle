import { useEffect, useRef } from 'react'
import {
  BALL_DIAMETER_INCHES,
  CUP_DIAMETER_INCHES,
  CUP_RADIUS_YARDS,
} from '../game/physics.ts'
import { terrainHeight, windVector } from '../game/seed.ts'
import type { Hole, Vec3 } from '../game/types.ts'
import { project, type Camera } from './project.ts'

type Props = {
  hole: Hole
  ball: Vec3
  aimDeg: number
  sidespin: number
  follow: boolean
  showAim: boolean
  zoom: number
  onAimDrag?: (deg: number) => void
}

type Point = { x: number; y: number; z?: number }

const HAZE: [number, number, number] = [246, 214, 168]

function tracePoly(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  width: number,
  height: number,
  points: Point[],
): boolean {
  const mapped = points.map((p) => project(p.x, p.y, p.z ?? 0, cam, width, height))
  if (mapped.some((m) => !m)) {
    return false
  }
  ctx.beginPath()
  mapped.forEach((m, i) => {
    if (!m) {
      return
    }
    if (i === 0) {
      ctx.moveTo(m.sx, m.sy)
    } else {
      ctx.lineTo(m.sx, m.sy)
    }
  })
  ctx.closePath()
  return true
}

function fillPoly(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  width: number,
  height: number,
  points: Point[],
  fill: string | CanvasGradient,
) {
  if (!tracePoly(ctx, cam, width, height, points)) {
    return
  }
  ctx.fillStyle = fill
  ctx.fill()
}

function strokePoly(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  width: number,
  height: number,
  points: Point[],
  stroke: string,
  lineWidth: number,
) {
  if (!tracePoly(ctx, cam, width, height, points)) {
    return
  }
  ctx.strokeStyle = stroke
  ctx.lineWidth = lineWidth
  ctx.stroke()
}

function ring(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  count: number,
  z: (x: number, y: number) => number,
): Point[] {
  const points: Point[] = []
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2
    const x = cx + Math.cos(a) * rx
    const y = cy + Math.sin(a) * ry
    points.push({ x, y, z: z(x, y) })
  }
  return points
}

function shade(hex: string, lift: number, fog = 0): string {
  const n = Number.parseInt(hex.slice(1), 16)
  const channel = (value: number, haze: number) => {
    const lit = Math.min(255, Math.max(0, value + lift))
    return Math.round(lit + (haze - lit) * fog)
  }
  const r = channel((n >> 16) & 255, HAZE[0])
  const g = channel((n >> 8) & 255, HAZE[1])
  const b = channel(n & 255, HAZE[2])
  return `rgb(${r}, ${g}, ${b})`
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const puffs: [number, number, number][] = [
    [-0.9, 0.15, 0.45],
    [-0.35, -0.2, 0.62],
    [0.3, -0.1, 0.55],
    [0.85, 0.15, 0.42],
  ]
  ctx.fillStyle = 'rgba(232, 160, 120, 0.45)'
  ctx.beginPath()
  ctx.ellipse(x, y + size * 0.28, size * 1.35, size * 0.32, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255, 246, 230, 0.92)'
  ctx.beginPath()
  for (const [dx, dy, r] of puffs) {
    ctx.moveTo(x + dx * size + r * size, y + dy * size)
    ctx.arc(x + dx * size, y + dy * size, r * size, 0, Math.PI * 2)
  }
  ctx.fill()
}

function drawHills(
  ctx: CanvasRenderingContext2D,
  width: number,
  horizon: number,
  rise: number,
  freq: number,
  phase: number,
  fill: string,
  bottom: number,
) {
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.moveTo(0, bottom)
  for (let x = 0; x <= width + 16; x += 16) {
    const t = x / Math.max(1, width)
    const y =
      horizon -
      rise * (0.55 + 0.45 * Math.sin(t * freq + phase)) -
      rise * 0.25 * Math.sin(t * freq * 2.7 + phase * 1.9)
    ctx.lineTo(x, y)
  }
  ctx.lineTo(width, bottom)
  ctx.closePath()
  ctx.fill()
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  width: number,
  height: number,
  tree: Hole['trees'][number],
  groundZ: number,
) {
  const base = project(tree.x, tree.y, groundZ, cam, width, height)
  const top = project(tree.x, tree.y, groundZ + tree.height, cam, width, height)
  if (!base || !top) {
    return
  }
  const scale = Math.max(0.6, base.scale / 16)
  const canopy = Math.max(8, tree.radius * 5.5 * scale)

  ctx.fillStyle = 'rgba(10, 40, 18, 0.28)'
  ctx.beginPath()
  ctx.ellipse(base.sx + canopy * 0.35, base.sy, canopy * 0.95, canopy * 0.26, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#4a2a12'
  ctx.lineWidth = Math.max(2, 3.2 * scale)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(base.sx, base.sy)
  ctx.lineTo(top.sx, top.sy)
  ctx.stroke()

  ctx.fillStyle = '#0e4a22'
  ctx.strokeStyle = '#08311a'
  ctx.lineWidth = Math.max(1, 1.4 * scale)
  ctx.beginPath()
  ctx.ellipse(top.sx, top.sy + canopy * 0.15, canopy * 0.74, canopy, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#1c7434'
  ctx.beginPath()
  ctx.ellipse(top.sx - canopy * 0.06, top.sy - canopy * 0.02, canopy * 0.6, canopy * 0.78, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#3f9e45'
  ctx.beginPath()
  ctx.ellipse(top.sx - canopy * 0.2, top.sy - canopy * 0.3, canopy * 0.3, canopy * 0.38, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255, 214, 140, 0.22)'
  ctx.beginPath()
  ctx.ellipse(top.sx - canopy * 0.28, top.sy - canopy * 0.45, canopy * 0.14, canopy * 0.18, -0.3, 0, Math.PI * 2)
  ctx.fill()
}

export function Pseudo3D({ hole, ball, aimDeg, sidespin, follow, showAim, zoom, onAimDrag }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ pointerId: number; startX: number; startAim: number } | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) {
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    const draw = () => {
      const parent = canvas.parentElement
      const width = Math.max(1, parent?.clientWidth ?? window.innerWidth)
      const height = Math.max(1, parent?.clientHeight ?? window.innerHeight)
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const cam: Camera = follow
        ? {
            x: ball.x * 0.35,
            y: ball.y - 22 / zoom,
            z: 7.2 / Math.sqrt(zoom) + ball.z * 0.18,
            yaw: 0,
            zoom,
          }
        : { x: 0, y: -22 / zoom, z: 8.2 / Math.sqrt(zoom), yaw: 0, zoom }

      const horizon = height * 0.46
      const sky = ctx.createLinearGradient(0, 0, 0, horizon)
      sky.addColorStop(0, '#3f7fd6')
      sky.addColorStop(0.45, '#8fb8ea')
      sky.addColorStop(0.78, '#ffcf9a')
      sky.addColorStop(1, '#ffe7b8')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, width, height)

      const sunX = width * 0.8
      const sunY = horizon - 46
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, Math.max(120, width * 0.3))
      sunGlow.addColorStop(0, 'rgba(255, 246, 210, 0.95)')
      sunGlow.addColorStop(0.12, 'rgba(255, 220, 150, 0.6)')
      sunGlow.addColorStop(1, 'rgba(255, 190, 120, 0)')
      ctx.fillStyle = sunGlow
      ctx.fillRect(0, 0, width, horizon + 40)
      ctx.fillStyle = '#fff6da'
      ctx.beginPath()
      ctx.arc(sunX, sunY, 16, 0, Math.PI * 2)
      ctx.fill()

      const cloudScale = Math.min(1.4, Math.max(0.7, width / 900))
      drawCloud(ctx, width * 0.17, height * 0.12, 42 * cloudScale)
      drawCloud(ctx, width * 0.62, height * 0.07, 34 * cloudScale)
      drawCloud(ctx, width * 0.9, height * 0.17, 26 * cloudScale)
      drawCloud(ctx, width * 0.4, height * 0.22, 20 * cloudScale)

      drawHills(ctx, width, horizon, 56, 3.4, 0.6, '#c99a8c', horizon + 40)
      drawHills(ctx, width, horizon, 34, 5.1, 2.2, '#8f9f6c', horizon + 40)
      drawHills(ctx, width, horizon, 16, 8.3, 4.1, '#5f8a4c', height)
      const hillHaze = ctx.createLinearGradient(0, horizon - 70, 0, horizon + 10)
      hillHaze.addColorStop(0, 'rgba(255, 226, 180, 0)')
      hillHaze.addColorStop(1, 'rgba(255, 226, 180, 0.55)')
      ctx.fillStyle = hillHaze
      ctx.fillRect(0, horizon - 70, width, height - horizon + 70)

      const far = hole.yards + 48
      const xStep = 7
      const yStep = 9
      for (let y = -12; y < far; y += yStep) {
        for (let x = -62; x < 62; x += xStep) {
          const z00 = terrainHeight(x, y, hole)
          const z10 = terrainHeight(x + xStep, y, hole)
          const z11 = terrainHeight(x + xStep, y + yStep, hole)
          const z01 = terrainHeight(x, y + yStep, hole)
          const midX = x + xStep / 2
          const midY = y + yStep / 2
          const lift = Math.round((z00 + z11) * 10)
          const fairwayHalf = 15 + Math.max(0, 16 - midY / 14)
          const onFairway = Math.abs(midX) <= fairwayHalf && midY > -6 && midY < hole.yards + 10
          const onGreen =
            Math.hypot(midX - hole.pinX, midY - hole.yards) <= hole.greenRadius * 1.05
          const stripe = Math.floor((x + 62) / xStep) % 2 === 0
          const base = onGreen
            ? '#c6ee5a'
            : onFairway
              ? stripe
                ? '#5acb66'
                : '#47b457'
              : stripe
                ? '#2f8c44'
                : '#2a8340'
          const fog = Math.min(0.42, Math.max(0, (midY - 30) / far) * 0.5)
          const color = shade(base, lift, fog)
          fillPoly(
            ctx,
            cam,
            width,
            height,
            [
              { x, y, z: z00 },
              { x: x + xStep, y, z: z10 },
              { x: x + xStep, y: y + yStep, z: z11 },
              { x, y: y + yStep, z: z01 },
            ],
            color,
          )
        }
      }

      if (hole.water) {
        const wz = 0.05
        const { x: wx, y: wy, w: ww, h: wh } = hole.water
        const rect = (pad: number): Point[] => [
          { x: wx - pad, y: wy - pad, z: wz },
          { x: wx + ww + pad, y: wy - pad, z: wz },
          { x: wx + ww + pad, y: wy + wh + pad, z: wz },
          { x: wx - pad, y: wy + wh + pad, z: wz },
        ]
        fillPoly(ctx, cam, width, height, rect(0.9), '#245a3a')
        const near = project(wx + ww / 2, wy, wz, cam, width, height)
        const back = project(wx + ww / 2, wy + wh, wz, cam, width, height)
        const waterFill: string | CanvasGradient =
          near && back
            ? (() => {
                const g = ctx.createLinearGradient(0, back.sy, 0, near.sy)
                g.addColorStop(0, '#7cc3ee')
                g.addColorStop(0.35, '#2f8fd8')
                g.addColorStop(1, '#155fae')
                return g
              })()
            : '#1a74d0'
        fillPoly(ctx, cam, width, height, rect(0), waterFill)
        ctx.lineCap = 'round'
        for (let i = 0; i < 5; i += 1) {
          const sx = wx + ww * (0.12 + ((i * 0.37) % 0.7))
          const sy = wy + wh * (0.18 + i * 0.15)
          const p0 = project(sx, sy, wz, cam, width, height)
          const p1 = project(sx + ww * 0.16, sy, wz, cam, width, height)
          if (p0 && p1) {
            ctx.strokeStyle = 'rgba(255, 250, 230, 0.55)'
            ctx.lineWidth = Math.max(1, Math.min(3, p0.scale * 0.12))
            ctx.beginPath()
            ctx.moveTo(p0.sx, p0.sy)
            ctx.lineTo(p1.sx, p1.sy)
            ctx.stroke()
          }
        }
      }

      if (hole.bunker) {
        const { x: bx, y: by, r: br } = hole.bunker
        const onGround = (x: number, y: number) => terrainHeight(x, y, hole) + 0.08
        fillPoly(ctx, cam, width, height, ring(bx, by, br * 1.16, br * 0.82, 18, onGround), '#a8874c')
        fillPoly(ctx, cam, width, height, ring(bx, by, br, br * 0.7, 18, onGround), '#ecd59a')
        fillPoly(
          ctx,
          cam,
          width,
          height,
          ring(bx - br * 0.12, by + br * 0.08, br * 0.62, br * 0.4, 14, onGround),
          '#f8ebc4',
        )
      }

      const greenZ = hole.greenLift
      const gr = hole.greenRadius
      const gx = hole.pinX
      const gy = hole.yards
      fillPoly(
        ctx,
        cam,
        width,
        height,
        ring(gx, gy, gr * 1.5, gr * 1.18, 26, (x, y) => terrainHeight(x, y, hole)),
        '#2a7434',
      )
      fillPoly(ctx, cam, width, height, ring(gx, gy, gr * 1.22, gr * 0.98, 26, () => greenZ + 0.08), '#86d65c')
      const greenCenter = project(gx - gr * 0.25, gy - gr * 0.15, greenZ + 0.16, cam, width, height)
      const puttingFill: string | CanvasGradient = greenCenter
        ? (() => {
            const g = ctx.createRadialGradient(
              greenCenter.sx,
              greenCenter.sy,
              2,
              greenCenter.sx,
              greenCenter.sy,
              Math.max(20, greenCenter.scale * gr * 1.2),
            )
            g.addColorStop(0, '#e8ff8a')
            g.addColorStop(0.6, '#c8f05a')
            g.addColorStop(1, '#a6dc48')
            return g
          })()
        : '#d8ff4a'
      fillPoly(ctx, cam, width, height, ring(gx, gy, gr * 1.02, gr * 0.82, 26, () => greenZ + 0.16), puttingFill)
      const contour = Math.max(1, (greenCenter?.scale ?? 10) * 0.06)
      strokePoly(
        ctx,
        cam,
        width,
        height,
        ring(gx + gr * 0.18, gy + gr * 0.1, gr * 0.62, gr * 0.44, 22, () => greenZ + 0.16),
        'rgba(255, 255, 255, 0.16)',
        contour,
      )
      strokePoly(
        ctx,
        cam,
        width,
        height,
        ring(gx + gr * 0.26, gy + gr * 0.14, gr * 0.32, gr * 0.22, 18, () => greenZ + 0.16),
        'rgba(255, 255, 255, 0.14)',
        contour,
      )

      const teeZ = terrainHeight(0, 0, hole)
      const teeBox: Point[] = [
        { x: -2.4, y: -1.5, z: teeZ + 0.05 },
        { x: 2.4, y: -1.5, z: teeZ + 0.05 },
        { x: 2.4, y: 1.3, z: teeZ + 0.05 },
        { x: -2.4, y: 1.3, z: teeZ + 0.05 },
      ]
      fillPoly(ctx, cam, width, height, teeBox, '#6fd877')
      strokePoly(ctx, cam, width, height, teeBox, 'rgba(20, 70, 30, 0.45)', 2)
      for (const mx of [-1.9, 1.9]) {
        const marker = project(mx, 0.9, teeZ + 0.12, cam, width, height)
        if (marker) {
          const mr = Math.max(2.5, marker.scale * 0.18)
          ctx.fillStyle = '#e8322a'
          ctx.strokeStyle = '#5a0d0a'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(marker.sx, marker.sy - mr, mr, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
        }
      }

      const trees = [...hole.trees].sort((a, b) => b.y - a.y)
      for (const tree of trees) {
        drawTree(ctx, cam, width, height, tree, terrainHeight(tree.x, tree.y, hole))
      }

      const pinBase = project(hole.pinX, hole.yards, greenZ + 0.16, cam, width, height)
      const pinTop = project(hole.pinX, hole.yards, greenZ + 9.88, cam, width, height)
      if (pinBase) {
        const cupRx = Math.max(4.2, pinBase.scale * CUP_RADIUS_YARDS)
        const cupRy = Math.max(1.8, cupRx * 0.38)
        ctx.fillStyle = '#3a3428'
        ctx.beginPath()
        ctx.ellipse(pinBase.sx, pinBase.sy, cupRx * 1.18, cupRy * 1.18, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#12100c'
        ctx.beginPath()
        ctx.ellipse(pinBase.sx, pinBase.sy, cupRx, cupRy, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#070605'
        ctx.beginPath()
        ctx.ellipse(
          pinBase.sx,
          pinBase.sy + cupRy * 0.18,
          cupRx * 0.62,
          cupRy * 0.52,
          0,
          0,
          Math.PI * 2,
        )
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.28)'
        ctx.lineWidth = Math.max(1, cupRx * 0.08)
        ctx.beginPath()
        ctx.ellipse(pinBase.sx, pinBase.sy, cupRx, cupRy, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      if (pinBase && pinTop) {
        ctx.lineCap = 'round'
        ctx.strokeStyle = '#1b1b1b'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(pinBase.sx, pinBase.sy)
        ctx.lineTo(pinTop.sx, pinTop.sy)
        ctx.stroke()
        ctx.strokeStyle = '#f7f3e8'
        ctx.lineWidth = 2
        ctx.stroke()

        const fw = Math.max(16, Math.min(34, (pinTop.sy - pinBase.sy) * -0.14))
        const fh = fw * 0.62
        const fx = pinTop.sx + 1
        const fy = pinTop.sy
        ctx.fillStyle = '#e10600'
        ctx.strokeStyle = '#6a0400'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(fx, fy)
        ctx.bezierCurveTo(fx + fw * 0.35, fy - fh * 0.22, fx + fw * 0.6, fy + fh * 0.18, fx + fw, fy - fh * 0.02)
        ctx.lineTo(fx + fw * 0.96, fy + fh * 0.7)
        ctx.bezierCurveTo(fx + fw * 0.6, fy + fh * 0.9, fx + fw * 0.35, fy + fh * 0.5, fx, fy + fh * 0.78)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)'
        ctx.beginPath()
        ctx.moveTo(fx, fy)
        ctx.bezierCurveTo(fx + fw * 0.35, fy - fh * 0.22, fx + fw * 0.6, fy + fh * 0.18, fx + fw, fy - fh * 0.02)
        ctx.lineTo(fx + fw * 0.98, fy + fh * 0.2)
        ctx.bezierCurveTo(fx + fw * 0.6, fy + fh * 0.38, fx + fw * 0.35, fy + fh * 0.02, fx, fy + fh * 0.22)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = '#ffe14a'
        ctx.beginPath()
        ctx.arc(pinTop.sx, pinTop.sy, 2.6, 0, Math.PI * 2)
        ctx.fill()
      }

      const aim = (aimDeg * Math.PI) / 180
      if (showAim && !follow) {
        const reach = 20
        const arc: { sx: number; sy: number }[] = []
        for (let i = 0; i <= 24; i += 1) {
          const t = i / 24
          const bend = sidespin * reach * 0.4 * t * t
          const p = project(
            Math.sin(aim) * reach * t + Math.cos(aim) * bend,
            Math.cos(aim) * reach * t - Math.sin(aim) * bend,
            teeZ + 0.1 + Math.sin((t * Math.PI) / 2) * 4.5,
            cam,
            width,
            height,
          )
          if (p) {
            arc.push(p)
          }
        }
        if (arc.length > 1) {
          ctx.save()
          ctx.lineCap = 'round'
          ctx.setLineDash([0.1, 11])
          ctx.beginPath()
          arc.forEach((p, i) => (i === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy)))
          ctx.strokeStyle = 'rgba(40, 28, 0, 0.55)'
          ctx.lineWidth = 7.5
          ctx.stroke()
          ctx.strokeStyle = '#ffe14a'
          ctx.lineWidth = 5
          ctx.stroke()
          ctx.restore()
        }
      }

      const wind = windVector(hole)
      ctx.save()
      ctx.translate(width / 2, 108)
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(0, 0, 26, 0, Math.PI * 2)
      ctx.stroke()
      ctx.rotate(Math.atan2(wind.x, wind.y))
      ctx.beginPath()
      ctx.moveTo(0, 16)
      ctx.lineTo(0, -18)
      ctx.lineTo(-6, -8)
      ctx.moveTo(0, -18)
      ctx.lineTo(6, -8)
      ctx.stroke()
      ctx.restore()
      ctx.save()
      ctx.font = '16px Anton, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.lineJoin = 'round'
      ctx.lineWidth = 5
      ctx.strokeStyle = '#111'
      ctx.fillStyle = '#ffe14a'
      const mph = `${Math.round(hole.windSpeedMph)} MPH`
      ctx.strokeText(mph, width / 2, 148)
      ctx.fillText(mph, width / 2, 148)
      ctx.restore()

      const groundZ = terrainHeight(ball.x, ball.y, hole)
      const inCup =
        Math.hypot(ball.x - hole.pinX, ball.y - hole.yards) <= CUP_RADIUS_YARDS * 1.2 &&
        ball.z < 0
      const drawZ = inCup
        ? greenZ + 0.16 + ball.z
        : Math.max(ball.z, groundZ + 0.08)
      const shadow = inCup ? null : project(ball.x, ball.y, groundZ, cam, width, height)
      const ballP = project(ball.x, ball.y, drawZ, cam, width, height)
      const airborne = Math.max(0, ball.z - groundZ)
      if (shadow) {
        const spread = 1 + Math.min(1.2, airborne * 0.08)
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0.12, 0.34 - airborne * 0.012)})`
        ctx.beginPath()
        ctx.ellipse(shadow.sx + 2, shadow.sy, 8 * spread, 3.4 * spread, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      if (ballP) {
        const worldR = (BALL_DIAMETER_INCHES / 2 / 36) * ballP.scale
        const cupPx = Math.max(4.2, ballP.scale * CUP_RADIUS_YARDS)
        const r = inCup
          ? Math.min(cupPx * (BALL_DIAMETER_INCHES / CUP_DIAMETER_INCHES) * 0.92, Math.max(2.2, worldR))
          : Math.max(5, 6.4 * (ballP.scale / 18))
        const onTee = !follow && !inCup && Math.hypot(ball.x, ball.y) < 0.6 && airborne < 0.3
        if (onTee) {
          ctx.fillStyle = '#f2b65a'
          ctx.strokeStyle = '#8a5a1c'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(ballP.sx - r * 0.42, ballP.sy + r * 0.6)
          ctx.lineTo(ballP.sx + r * 0.42, ballP.sy + r * 0.6)
          ctx.lineTo(ballP.sx + r * 0.14, ballP.sy + r * 2.2)
          ctx.lineTo(ballP.sx - r * 0.14, ballP.sy + r * 2.2)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
        }
        const by = onTee ? ballP.sy - r * 0.2 : ballP.sy
        const g = ctx.createRadialGradient(ballP.sx - r * 0.35, by - r * 0.35, r * 0.15, ballP.sx, by, r)
        g.addColorStop(0, '#ffffff')
        g.addColorStop(0.7, '#eceae4')
        g.addColorStop(1, '#b9b6ae')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(ballP.sx, by, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#222'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }

    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [aimDeg, ball, follow, hole, showAim, sidespin, zoom])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || !showAim || !onAimDrag) {
      return
    }

    const onDown = (event: PointerEvent) => {
      drag.current = { pointerId: event.pointerId, startX: event.clientX, startAim: aimDeg }
      try {
        canvas.setPointerCapture(event.pointerId)
      } catch {
        /* untrusted or synthetic pointer events still aim via move listeners */
      }
    }
    const onMove = (event: PointerEvent) => {
      if (!drag.current || drag.current.pointerId !== event.pointerId) {
        return
      }
      const dx = event.clientX - drag.current.startX
      const next = drag.current.startAim + (dx / Math.max(320, window.innerWidth)) * 40
      onAimDrag(Math.max(-16, Math.min(16, next)))
    }
    const onUp = (event: PointerEvent) => {
      if (drag.current?.pointerId === event.pointerId) {
        drag.current = null
      }
    }
    const onCancel = () => {
      drag.current = null
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onCancel)
    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onCancel)
    }
  }, [aimDeg, onAimDrag, showAim])

  return (
    <canvas
      ref={ref}
      className={showAim ? 'course aiming' : 'course'}
      aria-label="Pinle hole view. Drag left or right to aim."
    />
  )
}
