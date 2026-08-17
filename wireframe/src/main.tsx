import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { CargoProvider } from './cargoStore'
import { InterstateProvider } from './interstateStore'
import './styles.css'
import './cargo.css'
import './interstate.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CargoProvider>
        <InterstateProvider><App /></InterstateProvider>
      </CargoProvider>
    </BrowserRouter>
  </StrictMode>,
)
