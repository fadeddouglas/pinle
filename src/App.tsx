import { useCallback, useEffect, useState } from 'react'
import { recommendedClubId } from './game/clubs.ts'
import { bestShot, simulateShot } from './game/physics.ts'
import { createHole } from './game/seed.ts'
import type { ShotResult, Vec3 } from './game/types.ts'
import { shareResult } from './share/shareCard.ts'
import { loadSavedDay, saveDay } from './storage.ts'
import { Hud } from './ui/Hud.tsx'
import { Landing } from './ui/Landing.tsx'
import { Result } from './ui/Result.tsx'
import { Pseudo3D } from './view/Pseudo3D.tsx'

type Phase = 'aim' | 'fly' | 'done'

const SHOTS_PER_DAY = 3
const DEFAULT_ZOOM = 1
const MIN_ZOOM = 0.7
const MAX_ZOOM = 2.4

function shareMessage(kind: string): string {
  if (kind === 'shared') {
    return 'SHARED WITH YOUR CREW'
  }
  if (kind === 'copied-image') {
    return 'CARD COPIED'
  }
  if (kind === 'downloaded') {
    return 'CARD SAVED — PASTE THE SCORE BELOW'
  }
  return 'SCORE COPIED'
}

export default function App() {
  const [hole] = useState(() => createHole())
  const [clubId, setClubId] = useState(() => recommendedClubId(hole.yards))
  const [aimDeg, setAimDeg] = useState(0)
  const [backspin, setBackspin] = useState(0.4)
  const [sidespin, setSidespin] = useState(0)
  const [power, setPower] = useState(0.82)
  const [phase, setPhase] = useState<Phase>('aim')
  const [ball, setBall] = useState<Vec3>({ x: 0, y: 0, z: 0.05 })
  const [result, setResult] = useState<ShotResult | null>(null)
  const [shots, setShots] = useState<ShotResult[]>([])
  const [shareStatus, setShareStatus] = useState<string | null>(null)
  const [accountOpen, setAccountOpen] = useState(false)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const saved = loadSavedDay()
    if (saved && saved.dayKey === hole.dayKey && saved.results.length > 0) {
      const last = saved.results[saved.results.length - 1]
      setShots(saved.results)
      setResult(last)
      setBall({ x: last.rest.x, y: last.rest.y, z: 0 })
      setPhase('done')
      setClubId(last.clubId)
      setAimDeg(last.aimDeg)
      setBackspin(last.backspin)
      setSidespin(last.sidespin)
      setPower(last.power)
    }
  }, [hole.dayKey])

  useEffect(() => {
    if (phase !== 'fly' || !result) {
      return
    }
    const path = result.path
    if (path.length === 0) {
      setPhase('done')
      return
    }
    let i = 0
    let frame = 0
    const tick = () => {
      setBall(path[Math.min(i, path.length - 1)])
      i += 1
      if (i >= path.length) {
        setPhase('done')
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [phase, result])

  const handleSwing = useCallback(() => {
    if (phase !== 'aim' || shots.length >= SHOTS_PER_DAY) {
      return
    }
    const shot = simulateShot({ clubId, power, aimDeg, backspin, sidespin }, hole)
    const nextShots = [...shots, { ...shot, path: [] }]
    saveDay({ dayKey: hole.dayKey, results: nextShots })
    setShots(nextShots)
    setResult(shot)
    setPhase('fly')
  }, [aimDeg, backspin, clubId, hole, phase, power, shots, sidespin])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        handleSwing()
      }
      if (phase !== 'aim') {
        return
      }
      if (event.key === 'ArrowLeft' || event.key === 'a') {
        setAimDeg((v) => Math.max(-16, v - 1))
      }
      if (event.key === 'ArrowRight' || event.key === 'd') {
        setAimDeg((v) => Math.min(16, v + 1))
      }
      if (event.key === '=' || event.key === '+') {
        setZoom((v) => Math.min(MAX_ZOOM, v * 1.2))
      }
      if (event.key === '-' || event.key === '_') {
        setZoom((v) => Math.max(MIN_ZOOM, v / 1.2))
      }
      if (event.key === '0') {
        setZoom(DEFAULT_ZOOM)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSwing, phase])

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY < 0) {
        setZoom((v) => Math.min(MAX_ZOOM, v * 1.12))
      } else if (event.deltaY > 0) {
        setZoom((v) => Math.max(MIN_ZOOM, v / 1.12))
      }
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  function handleNextShot() {
    if (shots.length >= SHOTS_PER_DAY) {
      return
    }
    setClubId(recommendedClubId(hole.yards))
    setAimDeg(0)
    setBackspin(0.4)
    setSidespin(0)
    setPower(0.82)
    setPhase('aim')
    setBall({ x: 0, y: 0, z: 0.05 })
    setResult(null)
    setShareStatus(null)
  }

  async function handleShare() {
    if (!result) {
      return
    }
    try {
      const roundDone = shots.length >= SHOTS_PER_DAY
      const kind = await shareResult(
        hole,
        roundDone ? bestShot(shots) : result,
        roundDone ? shots : undefined,
      )
      setShareStatus(shareMessage(kind))
    } catch {
      setShareStatus('COULD NOT SHARE — COPY IS BLOCKED')
    }
  }

  if (!playing) {
    return (
      <div className="app">
        <Landing onPlay={() => setPlaying(true)} />
      </div>
    )
  }

  return (
    <div className="app">
      <Pseudo3D
        hole={hole}
        ball={ball}
        aimDeg={aimDeg}
        follow={phase === 'fly'}
        showAim={phase === 'aim'}
        zoom={zoom}
        onAimDrag={phase === 'aim' ? setAimDeg : undefined}
      />
      <header className="top">
        <div>
          <p className="brand">Pinle</p>
          <p className="day">
            #{hole.puzzleNumber} · {hole.yards} YD PAR 3
          </p>
        </div>
        <div className="top-actions">
          <button type="button" className="ghost small" onClick={() => setAccountOpen(true)}>
            ACCOUNT
          </button>
        </div>
      </header>
      <div className="zoom-dock">
        <button
          type="button"
          className="ghost small"
          onClick={() => setZoom((v) => Math.max(MIN_ZOOM, v / 1.2))}
        >
          −
        </button>
        <button type="button" className="ghost small" onClick={() => setZoom(DEFAULT_ZOOM)}>
          RESET ZOOM
        </button>
        <button
          type="button"
          className="ghost small"
          onClick={() => setZoom((v) => Math.min(MAX_ZOOM, v * 1.2))}
        >
          +
        </button>
      </div>
      {phase !== 'done' ? (
        <Hud
          clubId={clubId}
          aimDeg={aimDeg}
          power={power}
          backspin={backspin}
          sidespin={sidespin}
          phase={phase}
          onClub={setClubId}
          onAim={setAimDeg}
          onPower={setPower}
          onBackspin={setBackspin}
          onSidespin={setSidespin}
          onSwing={handleSwing}
        />
      ) : result ? (
        <Result
          hole={hole}
          result={result}
          results={shots}
          triesMax={SHOTS_PER_DAY}
          shareStatus={shareStatus}
          onShare={handleShare}
          onAccount={() => setAccountOpen(true)}
          onNextShot={shots.length < SHOTS_PER_DAY ? handleNextShot : undefined}
        />
      ) : null}
      {accountOpen ? (
        <div className="modal" role="dialog" aria-label="Optional account">
          <div className="sheet">
            <h2>ACCOUNT</h2>
            <p>
              Play and share without signing in. An optional account for saving scores across
              devices comes later — not required for today&apos;s pin.
            </p>
            <button type="button" className="swing" onClick={() => setAccountOpen(false)}>
              KEEP PLAYING
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
