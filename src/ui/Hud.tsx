import { CLUBS } from '../game/clubs.ts'

type Props = {
  clubId: string
  aimDeg: number
  power: number
  backspin: number
  sidespin: number
  phase: 'aim' | 'fly' | 'done'
  onClub: (id: string) => void
  onAim: (deg: number) => void
  onPower: (value: number) => void
  onBackspin: (value: number) => void
  onSidespin: (value: number) => void
  onSwing: () => void
}

export function Hud({
  clubId,
  aimDeg,
  power,
  backspin,
  sidespin,
  phase,
  onClub,
  onAim,
  onPower,
  onBackspin,
  onSidespin,
  onSwing,
}: Props) {
  const locked = phase === 'fly' || phase === 'done'
  const swingLabel = phase === 'fly' ? 'IN FLIGHT' : 'SWING'

  return (
    <>
      <div className="hud-left">
        <label className="slider">
          <span>AIM {aimDeg.toFixed(0)}°</span>
          <input
            type="range"
            min={-16}
            max={16}
            step={0.5}
            value={aimDeg}
            disabled={locked}
            onChange={(e) => onAim(Number(e.target.value))}
          />
        </label>
        <label className="slider">
          <span>POWER {Math.round(power * 100)}%</span>
          <input
            type="range"
            min={0.08}
            max={1}
            step={0.01}
            value={power}
            disabled={locked}
            onChange={(e) => onPower(Number(e.target.value))}
          />
        </label>
        <label className="slider">
          <span>BACKSPIN</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={backspin}
            disabled={locked}
            onChange={(e) => onBackspin(Number(e.target.value))}
          />
        </label>
        <label className="slider">
          <button
            type="button"
            className="spin-snap"
            disabled={locked}
            onClick={() => onSidespin(0)}
          >
            SIDESPIN {sidespin === 0 ? 'NONE' : sidespin > 0 ? 'FADE' : 'DRAW'}
          </button>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={sidespin}
            disabled={locked}
            onChange={(e) => {
              const value = Number(e.target.value)
              onSidespin(Math.abs(value) < 0.12 ? 0 : value)
            }}
          />
        </label>
        <button type="button" className="swing" disabled={phase === 'fly'} onClick={onSwing}>
          {swingLabel}
        </button>
      </div>
      <div className="hud-right">
        {CLUBS.map((club) => (
          <button
            key={club.id}
            type="button"
            className={club.id === clubId ? 'club on' : 'club'}
            disabled={locked}
            onClick={() => onClub(club.id)}
          >
            {club.name}
          </button>
        ))}
      </div>
    </>
  )
}
