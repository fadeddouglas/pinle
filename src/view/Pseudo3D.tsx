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
  follow: boolean
  showAim: boolean
  zoom: number
  onAimDrag?: (deg: number) => void
}

type Point = { x: number; y: number; z?: number }

function fillPoly(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  width: number,
  height: number,
  points: Point[],
  fill: string,
) {
  const mapped = points.map((p) => project(p.x, p.y, p.z ?? 0, cam, width, height))
  if (mapped.some((m) => !m)) {
    return
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
  ctx.fillStyle = fill
  ctx.fill()
}

function shade(hex: string, lift: number): string {
  const n = Number.parseInt(hex.slice(1), 16)
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + lift))
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + lift))
  const b = Math.min(255, Math.max(0, (n & 255) + lift))
  return `rgb(${r}, ${g}, ${b})`
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
  ctx.strokeStyle = '#4a2a12'
  ctx.lineWidth = Math.max(2, 3.2 * scale)
  ctx.beginPath()
  ctx.moveTo(base.sx, base.sy)
  ctx.lineTo(top.sx, top.sy)
  ctx.stroke()

  const canopy = Math.max(8, tree.radius * 5.5 * scale)
  ctx.fillStyle = '#0f5a28'
  ctx.beginPath()
  ctx.ellipse(top.sx, top.sy + canopy * 0.15, canopy * 0.72, canopy, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1f8a3e'
  ctx.beginPath()
  ctx.ellipse(top.sx, top.sy - canopy * 0.05, canopy * 0.55, canopy * 0.72, 0, 0, Math.PI * 2)
  ctx.fill()
}

export function Pseudo3D({ hole, ball, aimDeg, follow, showAim, zoom, onAimDrag }: Props) {
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

      const sky = ctx.createLinearGradient(0, 0, 0, height * 0.5)
      sky.addColorStop(0, '#3aa8ff')
      sky.addColorStop(0.55, '#9ad4ff')
      sky.addColorStop(1, '#d7f1ff')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.beginPath()
      ctx.ellipse(width * 0.18, height * 0.12, 70, 22, 0, 0, Math.PI * 2)
      ctx.ellipse(width * 0.22, height * 0.11, 44, 16, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(width * 0.72, height * 0.09, 80, 20, 0, 0, Math.PI * 2)
      ctx.ellipse(width * 0.78, height * 0.08, 40, 14, 0, 0, Math.PI * 2)
      ctx.fill()

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
          let color = onGreen ? '#e7ff7a' : onFairway ? '#4ec45f' : '#2d8a42'
          color = shade(color, lift)
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
        fillPoly(
          ctx,
          cam,
          width,
          height,
          [
            { x: hole.water.x, y: hole.water.y, z: wz },
            { x: hole.water.x + hole.water.w, y: hole.water.y, z: wz },
            { x: hole.water.x + hole.water.w, y: hole.water.y + hole.water.h, z: wz },
            { x: hole.water.x, y: hole.water.y + hole.water.h, z: wz },
          ],
          '#1a74d0',
        )
      }

      if (hole.bunker) {
        const sand: Point[] = []
        for (let i = 0; i < 12; i += 1) {
          const a = (i / 12) * Math.PI * 2
          const sx = hole.bunker.x + Math.cos(a) * hole.bunker.r
          const sy = hole.bunker.y + Math.sin(a) * hole.bunker.r * 0.7
          sand.push({ x: sx, y: sy, z: terrainHeight(sx, sy, hole) + 0.08 })
        }
        fillPoly(ctx, cam, width, height, sand, '#e7d39a')
      }

      const greenZ = hole.greenLift
      const collar: Point[] = []
      const fringe: Point[] = []
      const putting: Point[] = []
      for (let i = 0; i < 22; i += 1) {
        const a = (i / 22) * Math.PI * 2
        const cx = Math.cos(a)
        const cy = Math.sin(a)
        collar.push({
          x: hole.pinX + cx * hole.greenRadius * 1.5,
          y: hole.yards + cy * hole.greenRadius * 1.18,
          z: terrainHeight(
            hole.pinX + cx * hole.greenRadius * 1.5,
            hole.yards + cy * hole.greenRadius * 1.18,
            hole,
          ),
        })
        fringe.push({
          x: hole.pinX + cx * hole.greenRadius * 1.22,
          y: hole.yards + cy * hole.greenRadius * 0.98,
          z: greenZ + 0.08,
        })
        putting.push({
          x: hole.pinX + cx * hole.greenRadius * 1.02,
          y: hole.yards + cy * hole.greenRadius * 0.82,
          z: greenZ + 0.16,
        })
      }
      fillPoly(ctx, cam, width, height, collar, '#5a3a14')
      fillPoly(ctx, cam, width, height, fringe, '#f4f1c4')
      fillPoly(ctx, cam, width, height, putting, '#d8ff4a')

      const teeZ = terrainHeight(0, 0, hole)
      fillPoly(
        ctx,
        cam,
        width,
        height,
        [
          { x: -2.2, y: -1.4, z: teeZ + 0.05 },
          { x: 2.2, y: -1.4, z: teeZ + 0.05 },
          { x: 2.2, y: 1.2, z: teeZ + 0.05 },
          { x: -2.2, y: 1.2, z: teeZ + 0.05 },
        ],
        '#6b4a1e',
      )

      const trees = [...hole.trees].sort((a, b) => b.y - a.y)
      for (const tree of trees) {
        drawTree(ctx, cam, width, height, tree, terrainHeight(tree.x, tree.y, hole))
      }

      const pinBase = project(hole.pinX, hole.yards, greenZ + 0.16, cam, width, height)
      const pinTop = project(hole.pinX, hole.yards, greenZ + 3.4, cam, width, height)
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
        ctx.strokeStyle = '#222'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(pinBase.sx, pinBase.sy)
        ctx.lineTo(pinTop.sx, pinTop.sy)
        ctx.stroke()
        ctx.fillStyle = '#e10600'
        ctx.beginPath()
        ctx.moveTo(pinTop.sx, pinTop.sy)
        ctx.lineTo(pinTop.sx + 14, pinTop.sy + 5)
        ctx.lineTo(pinTop.sx, pinTop.sy + 10)
        ctx.closePath()
        ctx.fill()
      }

      const aim = (aimDeg * Math.PI) / 180
      const a0 = project(0, 0, teeZ + 0.1, cam, width, height)
      const a1 = project(Math.sin(aim) * 10, Math.cos(aim) * 32, teeZ + 0.1, cam, width, height)
      if (a0 && a1 && showAim && !follow) {
        ctx.strokeStyle = '#ffe14a'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(a0.sx, a0.sy)
        ctx.lineTo(a1.sx, a1.sy)
        ctx.stroke()
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
      if (shadow) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)'
        ctx.beginPath()
        ctx.ellipse(shadow.sx, shadow.sy, 8, 3.4, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      if (ballP) {
        const worldR = (BALL_DIAMETER_INCHES / 2 / 36) * ballP.scale
        const cupPx = Math.max(4.2, ballP.scale * CUP_RADIUS_YARDS)
        const r = inCup
          ? Math.min(cupPx * (BALL_DIAMETER_INCHES / CUP_DIAMETER_INCHES) * 0.92, Math.max(2.2, worldR))
          : Math.max(5, 6.4 * (ballP.scale / 18))
        const g = ctx.createRadialGradient(
          ballP.sx - r * 0.3,
          ballP.sy - r * 0.3,
          r * 0.2,
          ballP.sx,
          ballP.sy,
          r,
        )
        g.addColorStop(0, '#fff')
        g.addColorStop(1, '#c8c8c8')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(ballP.sx, ballP.sy, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#222'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }

    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [aimDeg, ball, follow, hole, showAim, zoom])

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
