"use client"

import { useEffect, useRef, useState } from "react"

const sampleEntries = [
  "+1 (202) 555-0101",
  "+1 (202) 555-0102",
  "+1 (202) 555-0103",
  "+1 (202) 555-0104",
  "+1 (202) 555-0105",
  "+1 (202) 555-0106",
  "+1 (202) 555-0107",
  "+1 (202) 555-0108",
]

function parseEntries(value) {
  return value
    .split(/[\n,;]+/)
    .map((number) => number.trim())
    .filter(Boolean)
    .map((number) => ({ number, digits: number.replace(/\D/g, "") }))
    .filter(({ number, digits }) => /^[+\d\s().-]+$/.test(number) && digits.length >= 7 && digits.length <= 15)
}

function pickSecureIndex(length) {
  const range = 0x1_0000_0000
  const limit = range - (range % length)
  const value = new Uint32Array(1)

  do {
    globalThis.crypto.getRandomValues(value)
  } while (value[0] >= limit)

  return value[0] % length
}

function maskPhone(number) {
  const digits = number.replace(/\D/g, "")
  return `••• ••• ••• ${digits.slice(-4)}`
}

function Reel({ entries, selectedIndex, isSpinning }) {
  const getEntry = (offset) => entries.length ? entries[(selectedIndex + offset + entries.length) % entries.length] : null

  return (
    <div className={`reel-window${isSpinning ? " is-spinning" : ""}`} aria-live="off" aria-label={isSpinning ? "Phone numbers are rotating" : "Selected phone number"}>
      <div className="reel-row reel-row--side">{getEntry(-1) ? maskPhone(getEntry(-1).number) : "••• ••• ••• •••"}</div>
      <div className="reel-row reel-row--active" key={`${selectedIndex}-${isSpinning}`}>
        {getEntry(0) ? maskPhone(getEntry(0).number) : "••• ••• ••• •••"}
      </div>
      <div className="reel-row reel-row--side">{getEntry(1) ? maskPhone(getEntry(1).number) : "••• ••• ••• •••"}</div>
    </div>
  )
}

export default function RaffleDraw() {
  const [list, setList] = useState(sampleEntries.join("\n"))
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState(null)
  const [isWinnerRevealed, setIsWinnerRevealed] = useState(false)
  const [drawCount, setDrawCount] = useState(0)
  const intervalRef = useRef(null)
  const timeoutRef = useRef(null)
  const entries = parseEntries(list)

  useEffect(() => () => {
    window.clearInterval(intervalRef.current)
    window.clearTimeout(timeoutRef.current)
  }, [])

  function handleListChange(event) {
    setList(event.target.value)
    setWinner(null)
    setIsWinnerRevealed(false)
    setSelectedIndex(0)
  }

  function beginDraw() {
    if (isSpinning || entries.length === 0) return

    const winningIndex = pickSecureIndex(entries.length)
    setWinner(null)
    setIsWinnerRevealed(false)
    setIsSpinning(true)
    setDrawCount((count) => count + 1)

    intervalRef.current = window.setInterval(() => {
      setSelectedIndex((index) => (index + 1 + Math.floor(Math.random() * Math.max(entries.length - 1, 1))) % entries.length)
    }, 85)

    timeoutRef.current = window.setTimeout(() => {
      window.clearInterval(intervalRef.current)
      setSelectedIndex(winningIndex)
      setWinner(entries[winningIndex])
      setIsSpinning(false)
    }, 3500)
  }

  return (
    <main className="draw-app">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="RafflePro home"><span className="brand-mark">R</span><span>rafflepro</span></a>
        <div className="fairness-pill"><span className="fairness-dot" /> RANDOMIZED DRAW</div>
      </header>

      <section className="draw-layout" id="top" aria-labelledby="draw-title">
        <div className="draw-intro">
          <p className="eyebrow"><span className="eyebrow-line" /> THE MOMENT OF THE DRAW</p>
          <h1 id="draw-title">One name.<br />A little <em>luck.</em></h1>
          <p className="intro-copy">Load your entries, take a breath, and let the reels decide who takes it home.</p>
          <div className="draw-stats" aria-label="Draw information">
            <div><span className="stat-label">ELIGIBLE ENTRIES</span><strong>{entries.length.toString().padStart(2, "0")}</strong></div>
            <span className="stat-divider" />
            <div><span className="stat-label">DRAWS THIS SESSION</span><strong>{drawCount.toString().padStart(2, "0")}</strong></div>
          </div>
        </div>

        <section className="machine-card" aria-label="Raffle number draw machine">
          <div className="machine-lights" aria-hidden="true">{Array.from({ length: 7 }, (_, index) => <span key={index} />)}</div>
          <div className="machine-heading"><span>RAFFLE DRAW</span><span className="machine-id">RP — 001</span></div>
          <div className="machine-display">
            <div className="display-topline"><span>{isSpinning ? "DRAW IN PROGRESS" : winner ? "WINNING ENTRY" : "YOUR LUCKY NUMBER"}</span><span className={`display-indicator${isSpinning ? " is-active" : ""}`} aria-hidden="true" /></div>
            <Reel entries={entries} selectedIndex={selectedIndex} isSpinning={isSpinning} />
            <div className="display-caption">{isSpinning ? "THE REELS ARE TURNING" : winner ? "WE HAVE A WINNER" : "READY WHEN YOU ARE"}</div>
          </div>
          <button className={`draw-button${isSpinning ? " is-spinning" : ""}`} onClick={beginDraw} disabled={isSpinning || entries.length === 0}>
            <span className="button-icon" aria-hidden="true">{isSpinning ? "Ⅱ" : "▶"}</span>
            <span>{isSpinning ? "DRAWING…" : winner ? "DRAW AGAIN" : "START THE DRAW"}</span>
            {!isSpinning && <span className="button-arrow" aria-hidden="true">↗</span>}
          </button>
          <button className={`machine-lever${isSpinning ? " is-pulled" : ""}`} onClick={beginDraw} disabled={isSpinning || entries.length === 0} aria-label="Pull the lever to start the draw"><span className="machine-lever-rod" /><span className="machine-lever-ball" /></button>
          <p className="machine-footnote">Each valid entry has an equal chance of being selected.</p>
          {winner && !isSpinning && (
            <div className="winner-result" role="status" aria-live="polite">
              <span className="winner-kicker">CONGRATULATIONS</span>
              <strong>{isWinnerRevealed ? winner.number : maskPhone(winner.number)}</strong>
              <button className="reveal-button" onClick={() => setIsWinnerRevealed((revealed) => !revealed)}>
                {isWinnerRevealed ? "Hide full number" : "Reveal full number"}
              </button>
            </div>
          )}
        </section>

        <section className="entries-card" aria-labelledby="entries-title">
          <div className="entries-heading">
            <div><p className="eyebrow">THE GUEST LIST</p><h2 id="entries-title">Your entries<span className="entries-count">{entries.length}</span></h2></div>
            <span className="lock-mark" aria-label="Phone numbers are masked in the draw">•••</span>
          </div>
          <label className="sr-only" htmlFor="phone-entries">Phone number entries, one per line</label>
          <textarea id="phone-entries" className="entries-input" value={list} onChange={handleListChange} disabled={isSpinning} spellCheck="false" aria-describedby="entries-help" />
          <div className="entries-footer"><p id="entries-help">One phone number per line. Invalid entries are skipped.</p><span>{entries.length} VALID</span></div>
          <p className="privacy-note">Numbers stay in this page and are masked until you choose to reveal the winner.</p>
        </section>
      </section>

      <footer className="draw-footer"><span>RAFFLEPRO <span aria-hidden="true">/</span> MAKE GOOD THINGS HAPPEN</span><span>RANDOMLY SELECTED. FAIRLY CELEBRATED.</span></footer>
    </main>
  )
}
