const ITEMS = [
  {
    n: '01',
    title: 'Simulez',
    text: "Décrivez votre logement et vos travaux. L'estimation s'appuie sur des consommations moyennes par époque de construction.",
  },
  {
    n: '02',
    title: 'Comparez',
    text: "Visualisez l'impact sur votre facture, vos émissions de CO₂ et votre étiquette énergie.",
  },
  {
    n: '03',
    title: 'Passez à l’action',
    text: 'Un conseiller affine le projet avec un audit et vous oriente vers les aides adaptées.',
  },
]

export default function HowItWorks() {
  return (
    <section className="section section--alt">
      <div className="container">
        <p className="eyebrow center">Comment ça marche</p>
        <h2 className="center">Trois étapes vers un logement plus sobre</h2>
        <div className="steps">
          {ITEMS.map((it) => (
            <article key={it.n} className="step">
              <span className="step__n">{it.n}</span>
              <h3>{it.title}</h3>
              <p>{it.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
