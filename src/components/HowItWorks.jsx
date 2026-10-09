// Contenu des trois étapes
const STEPS = [
  {
    number: '01',
    title: 'Simulez',
    text: "Décrivez votre logement et vos travaux. L'estimation s'appuie sur des consommations moyennes par époque de construction.",
  },
  {
    number: '02',
    title: 'Comparez',
    text: "Visualisez l'impact sur votre facture, vos émissions de CO₂ et votre étiquette énergie.",
  },
  {
    number: '03',
    title: 'Passez à l’action',
    text: 'Un conseiller affine le projet avec un audit et vous oriente vers les aides adaptées.',
  },
]

// Section « Comment ça marche » en bas de page
export default function HowItWorks() {
  return (
    <section className="section section--alt">
      <div className="container">
        <p className="eyebrow center">Comment ça marche</p>
        <h2 className="center">Trois étapes vers un logement plus sobre</h2>
        <div className="steps">
          {STEPS.map((step) => (
            <article key={step.number} className="step">
              <span className="step__n">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
