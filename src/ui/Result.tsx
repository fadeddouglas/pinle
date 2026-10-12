import { formatDistance, formatRoundShareText, SITE_HOST } from '../game/physics.ts'
import type { Hole, ShotResult } from '../game/types.ts'
import { shareTextWithLink } from '../share/shareLink.ts'

type Props = {
  hole: Hole
  result: ShotResult
  results: ShotResult[]
  triesMax: number
  shareStatus: string | null
  sharedView?: boolean
  onShare: () => void
  onAccount: () => void
  onNextShot?: () => void
  onPlayToday?: () => void
}

export function Result({
  hole,
  result,
  results,
  triesMax,
  shareStatus,
  sharedView = false,
  onShare,
  onAccount,
  onNextShot,
  onPlayToday,
}: Props) {
  const used = results.length
  const remaining = Math.max(0, triesMax - used)
  const headline = result.ace ? 'ACE' : formatDistance(result.distanceFeet, false)
  const sub = result.ace
    ? 'IN THE JAR'
    : result.lie === 'water'
      ? 'FIND THE DROP'
      : 'FROM THE STICK'
  const scoreShots = remaining > 0 && !sharedView ? [result] : results
  const paste = shareTextWithLink(
    formatRoundShareText(hole.puzzleNumber, scoreShots),
    `https://${SITE_HOST}`,
  )

  return (
    <div className="result" role="dialog" aria-label="Shot result">
      <p className="kicker">
        {sharedView ? 'SHARED CARD · ' : ''}
        PINLE #{hole.puzzleNumber}
        {!sharedView && triesMax > 1 ? ` · SHOT ${used} OF ${triesMax}` : ''}
      </p>
      <h2>{headline}</h2>
      <p className="sub">{sub}</p>
      <p className="meta">
        {hole.yards} YD · {result.lie.toUpperCase()}
      </p>
      {sharedView && onPlayToday ? (
        <button type="button" className="swing" onClick={onPlayToday}>
          PLAY TODAY
        </button>
      ) : onNextShot && remaining > 0 ? (
        <button type="button" className="swing" onClick={onNextShot}>
          NEXT SHOT · {remaining} LEFT
        </button>
      ) : (
        <button type="button" className="swing" onClick={onShare}>
          SHARE
        </button>
      )}
      {!sharedView && onNextShot && remaining > 0 ? (
        <button type="button" className="ghost" onClick={onShare}>
          SHARE THIS SHOT
        </button>
      ) : null}
      {sharedView ? (
        <button type="button" className="ghost" onClick={onShare}>
          SHARE
        </button>
      ) : null}
      {shareStatus ? <p className="share-status">{shareStatus}</p> : null}
      <pre className="share-text" tabIndex={0}>
        {paste}
      </pre>
      {sharedView ? null : (
        <button type="button" className="ghost" onClick={onAccount}>
          OPTIONAL ACCOUNT
        </button>
      )}
      <p className="hint">
        {sharedView
          ? 'This is a shared card. Play today’s pin on your device.'
          : remaining > 0
            ? 'Take your next look at the same pin.'
            : 'Come back tomorrow for a new par 3. This hole is locked.'}
      </p>
    </div>
  )
}
