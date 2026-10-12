type Props = {
  onPlay: () => void
}

export function Landing({ onPlay }: Props) {
  return (
    <div className="landing">
      <h1 className="brand landing-title">Pinle</h1>
      <button type="button" className="swing landing-play" onClick={onPlay}>
        PLAY
      </button>
      <p className="landing-tag">
        One hole. Three shots.
        <br />
        Closest to the pin.
      </p>
    </div>
  )
}
