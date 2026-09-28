import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import { CargoProvider } from './cargoStore'
import { CommunicationProvider } from './communicationStore'
import { InterstateProvider } from './interstateStore'
import { PrototypeScenarioProvider } from './prototypeScenarioStore'
import { PreTripInspectionProvider } from './preTripInspectionStore'
import './styles.css'
import './cargo.css'
import './interstate.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <PrototypeScenarioProvider>
        <CommunicationProvider>
          <PreTripInspectionProvider>
            <CargoProvider>
              <InterstateProvider><App /></InterstateProvider>
            </CargoProvider>
          </PreTripInspectionProvider>
        </CommunicationProvider>
      </PrototypeScenarioProvider>
    </HashRouter>
  </StrictMode>,
)
