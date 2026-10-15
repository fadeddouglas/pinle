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
  canSend: boolean
  onCopy: () => void
  onSend: () => void
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
  canSend,
  onCopy,
  onSend,
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
  const paste = shareTextWithLink(formatRoundShareText(hole.puzzleNumber, scoreShots), `https://${SITE_HOST}`)
  const roundOver = !sharedView && !(onNextShot && remaining > 0)

  const shareButtons = (primary: boolean) => (
    <div className="share-row">
      {canSend ? (
        <button type="button" className={primary ? 'swing' : 'ghost'} onClick={onSend}>
          SEND CARD
        </button>
      ) : null}
      <button type="button" className={primary && !canSend ? 'swing' : 'ghost'} onClick={onCopy}>
        COPY CARD
      </button>
    </div>
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
      ) : !roundOver && onNextShot ? (
        <button type="button" className="swing" onClick={onNextShot}>
          NEXT SHOT · {remaining} LEFT
        </button>
      ) : null}
      {shareButtons(roundOver)}
      {canSend ? <p className="share-note">Messages, Instagram, WhatsApp &amp; more</p> : null}
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
