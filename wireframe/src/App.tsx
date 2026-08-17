import { Navigate, Route, Routes } from 'react-router-dom'
import { CargoHomeScreen } from './screens/CargoHomeScreen'
import { DropoffVerifyScreen } from './screens/DropoffVerifyScreen'
import { PickupCaptureScreen } from './screens/PickupCaptureScreen'
import { InterstateBolScreen } from './screens/InterstateBolScreen'
import { InterstateBolsScreen } from './screens/InterstateBolsScreen'
import { InterstateLoadingScreen } from './screens/InterstateLoadingScreen'
import { InterstateReviewScreen } from './screens/InterstateReviewScreen'
import { InterstateScreen } from './screens/InterstateScreen'
import { InterstateTripScreen } from './screens/InterstateTripScreen'

export function App() {
  return (
    <Routes>
      <Route index element={<CargoHomeScreen />} />
      <Route path="pickup" element={<PickupCaptureScreen />} />
      <Route path="dropoff" element={<DropoffVerifyScreen />} />
      <Route path="interstate" element={<InterstateScreen />} />
      <Route path="interstate/loading" element={<InterstateLoadingScreen />} />
      <Route path="interstate/review" element={<InterstateReviewScreen />} />
      <Route path="interstate/trip" element={<InterstateTripScreen />} />
      <Route path="interstate/bols" element={<InterstateBolsScreen />} />
      <Route path="interstate/bol" element={<InterstateBolScreen />} />
      <Route path="interstate/bol/:bolNumber" element={<InterstateBolScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
