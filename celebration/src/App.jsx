import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import './App.css'
import queenAudio from '../Queen - We are the champions (Chorus only).mp3'

function splitMessage(text) {
  const words = text.trim().toUpperCase().split(/\s+/)
  if (words.length === 1) return words
  let best = 1
  for (let i = 2; i < words.length; i++) {
    const difference = (at) => Math.abs(words.slice(0, at).join(' ').length - words.slice(at).join(' ').length)
    if (difference(i) < difference(best)) best = i
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')]
}

function CelebrationTitle({ message }) {
  const titleRef = useRef(null)
  const lines = splitMessage(message)

  useLayoutEffect(() => {
    const title = titleRef.current
    const fit = () => {
      title.style.zoom = 1
      const bounds = title.getBoundingClientRect()
      const rows = [...title.children]
      const width = Math.max(...rows.map(row => row.getBoundingClientRect().width))
      // Reserve room for the subtle shadow and breathing space.
      const fontSize = parseFloat(getComputedStyle(title).fontSize)
      const availableWidth = Math.max(120, window.innerWidth - 64)
      const availableHeight = Math.max(120, window.innerHeight - 150)
      const scale = Math.min(1, availableWidth / (width + fontSize * 0.5), availableHeight / (bounds.height + fontSize * 0.7))
      title.style.zoom = scale
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(document.documentElement)
    let active = true
    document.fonts.ready.then(() => { if (active) fit() })
    return () => { active = false; observer.disconnect() }
  }, [message])

  return (
    <h1 className={`celebration-title ${['MINOR REVISION', 'MAJOR REVISION'].includes(message) ? 'revision-title' : ''}`} aria-label={message} ref={titleRef}>
      {lines.map((word, row) => (
        <span className={`title-word ${row === 0 && lines.length > 1 ? 'title-first' : 'title-revision'}`} aria-hidden="true" key={row}>
          {word}
        </span>
      ))}
    </h1>
  )
}

function App() {
  const [message, setMessage] = useState('')
  const [custom, setCustom] = useState('')
  const [selected, setSelected] = useState(0)
  const choices = ['MINOR REVISION', 'MAJOR REVISION', 'CUSTOM']
  const choiceRefs = useRef([])
  const inputRef = useRef(null)
  const backRef = useRef(null)
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => () => { audioRef.current?.pause() }, [])

  const playMusic = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(queenAudio)
      audioRef.current.addEventListener('ended', () => setPlaying(false))
      audioRef.current.addEventListener('error', () => setPlaying(false))
    }
    audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }

  useLayoutEffect(() => {
    if (message) backRef.current?.focus()
    else choiceRefs.current[selected]?.focus()
  }, [message])

  const choose = (index) => {
    setSelected(index)
    choiceRefs.current[index]?.focus()
  }
  const confirm = () => {
    const text = selected === 2 ? custom.trim() : choices[selected]
    if (text) {
      setMessage(text.toUpperCase())
      if (audioRef.current) audioRef.current.currentTime = 0
      playMusic()
    }
  }

  if (!message) return (
    <main className="selection stage-selection">
      <section className="selection-panel" aria-labelledby="selection-heading">
        <header className="selection-header">
          <div><p className="eyebrow">A MOMENT TO CELEBRATE</p>
          <h1 id="selection-heading" className="selection-heading">Choose your moment</h1></div>
          <span className="selection-counter">0{selected + 1} / 03</span>
        </header>
        <div className="stage-preview" aria-live="polite" aria-atomic="true">
          <span className="preview-caption">{selected === 2 ? 'MAKE IT YOURS' : 'YOUR NEXT CHAPTER'}</span>
          <div className="preview-title" key={selected}>
            {splitMessage(selected === 2 ? custom.trim() || 'YOUR MOMENT' : choices[selected]).map((line, i) => (
              <span key={i} style={{ fontSize: `${Math.min(1, 9 / Math.max(1, line.length))}em` }}>{line}</span>
            ))}
          </div>
          <span className="preview-description">{['A little polish. A big step forward.', 'A fresh perspective. A new beginning.', 'Your name. Your words. Your celebration.'][selected]}</span>
        </div>
        <div className="stage-browser">
          <button className="browse-arrow" aria-label="Previous choice" onClick={() => choose((selected + 2) % 3)}>←</button>
          <div className="stage-options" role="tablist" aria-label="Celebration choices" onKeyDown={event => {
            if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
              event.preventDefault()
              choose(event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (selected + (event.key === 'ArrowRight' ? 1 : 2)) % 3)
            }
          }}>
            {choices.map((choice, index) => (
              <button key={choice} ref={node => { choiceRefs.current[index] = node }} role="tab" aria-selected={selected === index}
                tabIndex={selected === index ? 0 : -1} aria-controls="choice-details" id={`choice-${index}`}
                className={`stage-card ${selected === index ? 'is-selected' : ''}`} onClick={() => setSelected(index)}>
                <span className="card-number">0{index + 1}</span>
                <span className="card-title">{choice}</span>
                <span className="card-status">{selected === index ? 'SELECTED' : 'SELECT'}</span>
              </button>
            ))}
          </div>
          <button className="browse-arrow" aria-label="Next choice" onClick={() => choose((selected + 1) % 3)}>→</button>
        </div>
        <form id="choice-details" role="tabpanel" aria-labelledby={`choice-${selected}`} onSubmit={event => { event.preventDefault(); confirm() }}>
          {selected === 2 && <div className="custom-fields">
            <label htmlFor="custom-message">Custom name or message</label>
            <input id="custom-message" ref={inputRef} value={custom} onChange={event => setCustom(event.target.value)} maxLength={60} placeholder="e.g. Congratulations Alex" />
            <div className="input-hint"><span>Text automatically adjusts to fit.</span><span>{custom.length}/60</span></div>
          </div>}
          <div className="selection-footer">
            <span className="navigation-hint">← → Browse · Select a card · Confirm</span>
            <button className="celebrate-button" disabled={selected === 2 && !custom.trim()} type="submit">Confirm selection <span aria-hidden="true">↗</span></button>
          </div>
        </form>
      </section>
    </main>
  )
  return (
    <main className="celebration">
      <button className="back-button" ref={backRef} onClick={() => {
        audioRef.current?.pause()
        if (audioRef.current) audioRef.current.currentTime = 0
        setPlaying(false)
        setMessage('')
      }}>← Change message</button>
      <button className="music-button" onClick={() => {
        if (playing) { audioRef.current?.pause(); setPlaying(false) }
        else playMusic()
      }}>{playing ? 'Pause music' : 'Play music'}</button>
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: 48 }, (_, i) => (
          <span key={i} className={`confetti-piece shape-${i % 3}`} style={{
            '--left': `${(i * 37 + 11) % 100}%`, '--delay': `${-((i * 7) % 90) / 10}s`,
            '--duration': `${7 + (i % 5)}s`, '--rotation': `${i * 29}deg`,
          }} />
        ))}
      </div>
      <CelebrationTitle message={message} />
    </main>
  )
}

export default App



