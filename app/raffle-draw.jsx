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

export default function RaffleDraw() {
  const [list, setList] = useState(sampleEntries.join("\n"))
  const [displayDigits, setDisplayDigits] = useState([])
  const [lockedReels, setLockedReels] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState(null)
  const intervalRef = useRef(null)
  const stopTimersRef = useRef([])
  const lockedReelsRef = useRef(0)
  const dialogRef = useRef(null)
  const entries = parseEntries(list)
  const reelCount = Math.max(1, ...entries.map(({ digits }) => digits.length))
  const visibleDigits = isSpinning || winner
    ? displayDigits
    : Array.from({ length: reelCount }, () => "0")

  useEffect(() => () => {
    window.clearInterval(intervalRef.current)
    stopTimersRef.current.forEach(window.clearTimeout)
  }, [])

  function handleListChange(event) {
    setList(event.target.value)
    setWinner(null)
    setDisplayDigits([])
  }

  function beginDraw() {
    if (isSpinning || entries.length === 0) return

    const selectedWinner = entries[pickSecureIndex(entries.length)]
    const targetDigits = selectedWinner.digits.padStart(reelCount, " ").split("")
    lockedReelsRef.current = 0
    setLockedReels(0)
    setWinner(null)
    setDisplayDigits(Array.from({ length: reelCount }, () => String(Math.floor(Math.random() * 10))))
    setIsSpinning(true)

    intervalRef.current = window.setInterval(() => {
      setDisplayDigits((current) => current.map((digit, index) => (
        index < lockedReelsRef.current ? digit : String(Math.floor(Math.random() * 10))
      )))
    }, 72)

    stopTimersRef.current = targetDigits.map((target, index) => window.setTimeout(() => {
      lockedReelsRef.current = index + 1
      setLockedReels(index + 1)
      setDisplayDigits((current) => current.map((digit, reelIndex) => (
        reelIndex === index ? target : digit
      )))

      if (index === targetDigits.length - 1) {
        window.clearInterval(intervalRef.current)
        setWinner(selectedWinner)
        setIsSpinning(false)
      }
    }, 1100 + index * 175))
  }

  function openEntryList() {
    dialogRef.current?.showModal()
  }

  function closeEntryList() {
    dialogRef.current?.close()
  }

  return (
    <main className="draw-app">
      <section className="machine-card" aria-label="Phone number raffle slot machine">
        <div className="machine-lights" aria-hidden="true">
          {Array.from({ length: 11 }, (_, index) => <span key={index} />)}
        </div>
        <div
          className={`digit-reels${isSpinning ? " is-spinning" : ""}`}
          style={{ "--slot-count": reelCount }}
          role="group"
          aria-label="Phone number digit reels"
          aria-live="off"
        >
          {Array.from({ length: reelCount }, (_, index) => {
            const digit = visibleDigits[index] ?? "0"
            const isLocked = isSpinning && index < lockedReels

            return (
              <div
                className={`digit-reel${isSpinning && !isLocked ? " is-rolling" : ""}${digit.trim() ? "" : " is-empty"}`}
                key={index}
                aria-hidden="true"
              >
                <span className="digit-value">{digit}</span>
              </div>
            )
          })}
        </div>
        <div className="machine-controls">
          <button
            className={`spin-button${isSpinning ? " is-spinning" : ""}`}
            onClick={beginDraw}
            disabled={isSpinning || entries.length === 0}
            aria-label={isSpinning ? "Drawing a winner" : "Spin to choose a winner"}
          >
            <span className="spin-button-ring"><span className="spin-button-core" /></span>
            <span>SPIN</span>
          </button>
        </div>
        <button
          className={`machine-lever${isSpinning ? " is-pulled" : ""}`}
          onClick={beginDraw}
          disabled={isSpinning || entries.length === 0}
          aria-label="Pull the lever to start the draw"
        >
          <span className="machine-lever-rod" />
          <span className="machine-lever-ball" />
        </button>
        <button
          className="entry-list-toggle"
          onClick={openEntryList}
          disabled={isSpinning}
          aria-label={`Edit phone number list, ${entries.length} valid entries`}
          title="Edit phone number list"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
          </svg>
        </button>
        <p className="sr-only" role="status" aria-live="polite">
          {winner ? `Winning phone number: ${winner.number}` : ""}
        </p>
      </section>

      <dialog className="entries-dialog" ref={dialogRef} aria-labelledby="entries-title">
        <form method="dialog" className="entries-dialog-content">
          <div className="entries-dialog-heading">
            <h2 id="entries-title">Phone number list</h2>
            <button className="entries-close" type="button" onClick={closeEntryList} aria-label="Close phone number list">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <label className="sr-only" htmlFor="phone-entries">Phone numbers, one per line</label>
          <textarea
            id="phone-entries"
            className="entries-input"
            value={list}
            onChange={handleListChange}
            spellCheck="false"
            aria-describedby="entries-help"
          />
          <p id="entries-help" className="entries-help">One phone number per line. Invalid entries are skipped.</p>
          <button className="entries-done" type="button" onClick={closeEntryList}>DONE</button>
        </form>
      </dialog>
    </main>
  )
}
