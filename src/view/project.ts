export type Camera = {
  x: number
  y: number
  z: number
  yaw: number
  zoom: number
}

export type Projected = {
  sx: number
  sy: number
  depth: number
  scale: number
}

export function project(
  wx: number,
  wy: number,
  wz: number,
  cam: Camera,
  width: number,
  height: number,
): Projected | null {
  const rx = wx - cam.x
  const ry = wy - cam.y
  const rz = wz - cam.z
  const cos = Math.cos(-cam.yaw)
  const sin = Math.sin(-cam.yaw)
  const dx = rx * cos - ry * sin
  const dy = rx * sin + ry * cos
  if (dy < 1.2) {
    return null
  }
  const fl = Math.min(width, height) * 0.72 * Math.max(0.5, cam.zoom)
  return {
    sx: width / 2 + (dx * fl) / dy,
    sy: height * 0.46 - (rz * fl) / dy,
    depth: dy,
    scale: fl / dy,
  }
}
