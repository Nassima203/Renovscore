import { useRef, useState } from 'react'
import Hero from './components/Hero.jsx'
import Simulator from './components/Simulator.jsx'
import Results from './components/Results.jsx'
import Report from './components/Report.jsx'
import LeadForm from './components/LeadForm.jsx'
import HowItWorks from './components/HowItWorks.jsx'

// Page unique : en-tête, accroche, simulateur (puis résultats), « Comment ça marche »
export default function App() {
  const [simulation, setSimulation] = useState(null) // { input, result } une fois la simulation terminée
  const simulatorRef = useRef(null)
  const resultsRef = useRef(null)

  // Défilement fluide vers une section
  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // Fin de simulation : affichage des résultats
  const showResults = (input, result) => {
    setSimulation({ input, result })
    requestAnimationFrame(() => scrollTo(resultsRef))
  }

  // Nouvelle simulation : retour au formulaire
  const restart = () => {
    setSimulation(null)
    requestAnimationFrame(() => scrollTo(simulatorRef))
  }

  return (
    <>
      <header className="topbar">
        <div className="container topbar__inner">
          <a href="#" className="logo" aria-label="Rénov'Score, accueil">
            <img src="/favicon.svg" alt="" width="28" height="28" />
            Rénov'Score
          </a>
          <button className="btn btn--small" onClick={() => scrollTo(simulatorRef)}>
            Simuler
          </button>
        </div>
      </header>

      <main>
        <Hero onStart={() => scrollTo(simulatorRef)} />

        <section ref={simulatorRef} id="simulateur" className="section">
          <div className="container narrow">
            {simulation ? (
              <div ref={resultsRef}>
                <Results result={simulation.result} onRestart={restart} />
                <Report input={simulation.input} result={simulation.result} />
                <LeadForm input={simulation.input} />
              </div>
            ) : (
              <Simulator onDone={showResults} />
            )}
          </div>
        </section>

        <HowItWorks />
      </main>
    </>
  )
}
