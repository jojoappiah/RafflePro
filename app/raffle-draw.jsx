"use client"

import { useEffect, useRef, useState } from "react"

const ROLL_START_DELAY = 1100
const REEL_FRAME_INTERVAL = 32
const DIGIT_STRIP_LENGTH = 100
const REGULAR_REEL_SPIN_INTERVAL = 72
const SLOW_REEL_SPIN_INTERVAL = 240
const REGULAR_REEL_STOP_INTERVAL = 175
const SLOW_REEL_STOP_INTERVAL = 480

const sampleEntries = [
  "024 000 0001",
  "024 000 0002",
  "024 000 0003",
  "024 000 0004",
  "024 000 0005",
  "024 000 0006",
  "024 000 0007",
  "024 000 0008",
]

function normalizeGhanaNumber(number) {
  const digits = number.replace(/\D/g, "")
  return digits.startsWith("233") ? `0${digits.slice(3)}` : digits
}

function parseEntries(value) {
  return value
    .split(/[\n,;]+/)
    .map((number) => number.trim())
    .filter(Boolean)
    .map((number) => ({ source: number, digits: normalizeGhanaNumber(number) }))
    .filter(({ source, digits }) => /^[+\d\s().-]+$/.test(source) && /^0\d{9}$/.test(digits))
    .map(({ digits }) => ({ number: digits, digits }))
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
  const [reelPositions, setReelPositions] = useState([])
  const [lockedReels, setLockedReels] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [isSlowdown, setIsSlowdown] = useState(false)
  const [winner, setWinner] = useState(null)
  const intervalRef = useRef(null)
  const slowdownTimerRef = useRef(null)
  const stopTimersRef = useRef([])
  const lockedReelsRef = useRef(0)
  const reelNextTickRef = useRef([])
  const reelPositionsRef = useRef([])
  const slowdownActiveRef = useRef(false)
  const dialogRef = useRef(null)
  const entries = parseEntries(list)
  const reelCount = Math.max(1, ...entries.map(({ digits }) => digits.length))
  const slowReelStart = Math.max(0, reelCount - 4)
  useEffect(() => () => {
    window.clearInterval(intervalRef.current)
    window.clearTimeout(slowdownTimerRef.current)
    stopTimersRef.current.forEach(window.clearTimeout)
  }, [])

  function handleListChange(event) {
    setList(event.target.value)
    setWinner(null)
    setReelPositions([])
    reelPositionsRef.current = []
    setLockedReels(0)
    setIsSlowdown(false)
    slowdownActiveRef.current = false
  }

  function beginDraw() {
    if (isSpinning || entries.length === 0) return

    const selectedWinner = entries[pickSecureIndex(entries.length)]
    const targetDigits = selectedWinner.digits.padStart(reelCount, " ").split("")
    const startPositions = Array.from({ length: reelCount }, (_, index) => (
      20 + ((reelPositionsRef.current[index] ?? 0) % 10)
    ))
    const spinStartedAt = window.performance.now()

    window.clearInterval(intervalRef.current)
    window.clearTimeout(slowdownTimerRef.current)
    lockedReelsRef.current = 0
    reelPositionsRef.current = startPositions
    reelNextTickRef.current = Array.from({ length: reelCount }, () => spinStartedAt)
    slowdownActiveRef.current = false
    setLockedReels(0)
    setReelPositions(startPositions)
    setWinner(null)
    setIsSlowdown(false)
    setIsSpinning(true)

    slowdownTimerRef.current = window.setTimeout(() => {
      slowdownActiveRef.current = true
      setIsSlowdown(true)
    }, ROLL_START_DELAY)

    intervalRef.current = window.setInterval(() => {
      const now = window.performance.now()
      const nextPositions = reelPositionsRef.current.slice()
      let hasMoved = false

      for (let index = 0; index < reelCount; index += 1) {
        if (index < lockedReelsRef.current || now < reelNextTickRef.current[index]) continue

        const isSlowReel = index >= slowReelStart && slowdownActiveRef.current
        reelNextTickRef.current[index] = now + (
          isSlowReel ? SLOW_REEL_SPIN_INTERVAL : REGULAR_REEL_SPIN_INTERVAL
        )
        nextPositions[index] += 1
        hasMoved = true
      }

      if (hasMoved) {
        reelPositionsRef.current = nextPositions
        setReelPositions(nextPositions)
      }
    }, REEL_FRAME_INTERVAL)

    stopTimersRef.current = targetDigits.map((target, index) => window.setTimeout(() => {
      const currentPosition = reelPositionsRef.current[index] ?? 0
      const targetDigit = Number(target)
      const digitOffset = (targetDigit - (currentPosition % 10) + 10) % 10
      const nextPositions = reelPositionsRef.current.slice()
      nextPositions[index] = currentPosition + (digitOffset || 10)
      reelPositionsRef.current = nextPositions
      lockedReelsRef.current = index + 1
      setLockedReels(index + 1)
      setReelPositions(nextPositions)

      if (index === targetDigits.length - 1) {
        window.clearInterval(intervalRef.current)
        window.clearTimeout(slowdownTimerRef.current)
        slowdownActiveRef.current = true
        setIsSlowdown(true)
        setWinner(selectedWinner)
        setIsSpinning(false)
      }
    }, ROLL_START_DELAY
      + Math.min(index, slowReelStart) * REGULAR_REEL_STOP_INTERVAL
      + Math.max(0, index - slowReelStart) * SLOW_REEL_STOP_INTERVAL))
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
            const stripPosition = reelPositions[index] ?? 0
            const isLocked = isSpinning && index < lockedReels
            const isSlowReel = index >= slowReelStart

            return (
              <div
                className={`digit-reel${isSpinning && !isLocked ? " is-rolling" : ""}${isSlowdown && isSlowReel ? " is-slow" : ""}`}
                key={index}
                aria-hidden="true"
              >
                <div
                  className="digit-strip"
                  style={{ "--strip-offset": `${-stripPosition}%` }}
                >
                  {Array.from({ length: DIGIT_STRIP_LENGTH }, (_, digitIndex) => (
                    <span key={digitIndex}>{digitIndex % 10}</span>
                  ))}
                </div>
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
          <p id="entries-help" className="entries-help">Use 10 digits starting with 0. A +233 prefix is converted to 0.</p>
          <button className="entries-done" type="button" onClick={closeEntryList}>DONE</button>
        </form>
      </dialog>
    </main>
  )
}
