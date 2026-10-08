import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Booking from './components/Booking.jsx'
import './styles.css'

// Deux pages : le simulateur (/) et la prise de rendez-vous (/rdv)
const isBooking = window.location.pathname.replace(/\/+$/, '') === '/rdv'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{isBooking ? <Booking /> : <App />}</React.StrictMode>,
)
