import logo from '../assets/logo.webp'
import './Arrival.css'

/** What replaces the headline once the clock reaches zero. `live` is true when the zero happened while watching. */
export function Arrival({ live }: { live: boolean }) {
  return (
    <div className="arrival" data-live={live}>
      <div className="arrival__door" aria-hidden="true">
        <span className="arrival__leaf arrival__leaf--l" />
        <span className="arrival__leaf arrival__leaf--r" />
        <span className="arrival__light" />
      </div>
      <img className="arrival__logo" src={logo} alt="The Legend of Zelda: Ocarina of Time" width={640} height={478} />
      <h1 className="arrival__title">
        <span className="gold-text">The Door of Time is open</span>
      </h1>
      <p className="arrival__line">Ocarina of Time is here, on Nintendo Switch 2. Time to go.</p>
    </div>
  )
}
