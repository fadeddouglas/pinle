import { formatDistance, formatRoundShareText } from '../game/physics.ts'
import type { Hole, ShotResult } from '../game/types.ts'

type Props = {
  hole: Hole
  result: ShotResult
  results: ShotResult[]
  triesMax: number
  shareStatus: string | null
  onShare: () => void
  onAccount: () => void
  onNextShot?: () => void
}

export function Result({
  hole,
  result,
  results,
  triesMax,
  shareStatus,
  onShare,
  onAccount,
  onNextShot,
}: Props) {
  const used = results.length
  const remaining = Math.max(0, triesMax - used)
  const headline = result.ace ? 'ACE' : formatDistance(result.distanceFeet, false)
  const sub = result.ace
    ? 'IN THE JAR'
    : result.lie === 'water'
      ? 'FIND THE DROP'
      : 'FROM THE STICK'

  return (
    <div className="result" role="dialog" aria-label="Shot result">
      <p className="kicker">
        PINLE #{hole.puzzleNumber}
        {triesMax > 1 ? ` · SHOT ${used} OF ${triesMax}` : ''}
      </p>
      <h2>{headline}</h2>
      <p className="sub">{sub}</p>
      <p className="meta">
        {hole.yards} YD · {result.lie.toUpperCase()}
      </p>
      {onNextShot && remaining > 0 ? (
        <button type="button" className="swing" onClick={onNextShot}>
          NEXT SHOT · {remaining} LEFT
        </button>
      ) : (
        <button type="button" className="swing" onClick={onShare}>
          SHARE
        </button>
      )}
      {onNextShot && remaining > 0 ? (
        <button type="button" className="ghost" onClick={onShare}>
          SHARE THIS SHOT
        </button>
      ) : null}
      {shareStatus ? <p className="share-status">{shareStatus}</p> : null}
      <pre className="share-text" tabIndex={0}>
        {formatRoundShareText(hole.puzzleNumber, remaining > 0 ? [result] : results)}
      </pre>
      <button type="button" className="ghost" onClick={onAccount}>
        OPTIONAL ACCOUNT
      </button>
      <p className="hint">
        {remaining > 0
          ? 'Take your next look at the same pin.'
          : 'Come back tomorrow for a new par 3. This hole is locked.'}
      </p>
    </div>
  )
}
