import { useRef, useState } from 'react'
import DemoBanner from './components/DemoBanner.jsx'
import Hero from './components/Hero.jsx'
import Simulator from './components/Simulator.jsx'
import Results from './components/Results.jsx'
import LeadForm from './components/LeadForm.jsx'
import HowItWorks from './components/HowItWorks.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  const [simulation, setSimulation] = useState(null) // { input, result }
  const simRef = useRef(null)
  const resultsRef = useRef(null)

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const handleDone = (input, result) => {
    setSimulation({ input, result })
    requestAnimationFrame(() => scrollTo(resultsRef))
  }

  const restart = () => {
    setSimulation(null)
    requestAnimationFrame(() => scrollTo(simRef))
  }

  return (
    <>
      <DemoBanner />
      <header className="topbar">
        <div className="container topbar__inner">
          <a href="#" className="logo" aria-label="Rénov'Score, accueil">
            <img src="/favicon.svg" alt="" width="28" height="28" />
            Rénov'Score
          </a>
          <button className="btn btn--small" onClick={() => scrollTo(simRef)}>
            Simuler
          </button>
        </div>
      </header>

      <main>
        <Hero onStart={() => scrollTo(simRef)} />

        <section ref={simRef} id="simulateur" className="section">
          <div className="container narrow">
            {!simulation ? (
              <Simulator onDone={handleDone} />
            ) : (
              <div ref={resultsRef}>
                <Results result={simulation.result} input={simulation.input} onRestart={restart} />
                <LeadForm simulation={simulation} />
              </div>
            )}
          </div>
        </section>

        <HowItWorks />
      </main>

      <Footer />
    </>
  )
}
