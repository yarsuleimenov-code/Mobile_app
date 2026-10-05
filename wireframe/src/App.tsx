import { Navigate, Route, Routes } from 'react-router-dom'
import { CargoHomeScreen } from './screens/CargoHomeScreen'
import { CargoPlaceScreen } from './screens/CargoPlaceScreen'
import { CommunicationsScreen } from './screens/CommunicationsScreen'
import { OrderCommunicationsScreen } from './screens/OrderCommunicationsScreen'
import { OrderCallScreen } from './screens/OrderCallScreen'
import { CargoPlacesScreen } from './screens/CargoPlacesScreen'
import { DropoffVerifyScreen } from './screens/DropoffVerifyScreen'
import { DeliveryEbolScreen } from './screens/DeliveryEbolScreen'
import { DeliverySignatureScreen } from './screens/DeliverySignatureScreen'
import { PickupCaptureScreen } from './screens/PickupCaptureScreen'
import { PlaceLabelsScreen } from './screens/PlaceLabelsScreen'
import { PickupEbolScreen } from './screens/PickupEbolScreen'
import { OrderDetailsScreen } from './screens/OrderDetailsScreen'
import { OrderPodScreen } from './screens/OrderPodScreen'
import { OrderDocumentScreen } from './screens/OrderDocumentScreen'
import { PickupSignatureScreen } from './screens/PickupSignatureScreen'
import { InterstateBolScreen } from './screens/InterstateBolScreen'
import { InterstateBolsScreen } from './screens/InterstateBolsScreen'
import { InterstateLoadingScreen } from './screens/InterstateLoadingScreen'
import { InterstateReviewScreen } from './screens/InterstateReviewScreen'
import { InterstateScreen } from './screens/InterstateScreen'
import { InterstateTripScreen } from './screens/InterstateTripScreen'
import { InterstateUnloadingScreen } from './screens/InterstateUnloadingScreen'
import { MoreScreen } from './screens/MoreScreen'
import { PrototypeControlsScreen } from './screens/PrototypeControlsScreen'
import { ScanScreen } from './screens/ScanScreen'
import { TasksScreen } from './screens/TasksScreen'
import { PreTripInspectionScreen } from './screens/PreTripInspectionScreen'
import { PostTripInspectionScreen } from './screens/PostTripInspectionScreen'

export function App() {
  return (
    <Routes>
      <Route index element={<CargoHomeScreen />} />
      <Route path="tasks" element={<TasksScreen />} />
      <Route path="communications" element={<CommunicationsScreen />} />
      <Route path="orders/:orderNumber/communications" element={<OrderCommunicationsScreen />} />
      <Route path="orders/:orderNumber/call" element={<OrderCallScreen />} />
      <Route path="scan" element={<ScanScreen />} />
      <Route path="more" element={<MoreScreen />} />
      <Route path="more/demo" element={<PrototypeControlsScreen />} />
      <Route path="pre-trip-inspection" element={<PreTripInspectionScreen />} />
      <Route path="post-trip-inspection" element={<PostTripInspectionScreen />} />
      <Route path="places" element={<CargoPlacesScreen />} />
      <Route path="places/:placeId" element={<CargoPlaceScreen />} />
      <Route path="pickup" element={<PickupCaptureScreen />} />
      <Route path="orders/:orderNumber/details" element={<OrderDetailsScreen />} />
      <Route path="orders/:orderNumber/labels" element={<PlaceLabelsScreen />} />
      <Route path="orders/:orderNumber/ebol/pickup" element={<PickupEbolScreen />} />
      <Route path="orders/:orderNumber/ebol/pickup/sign" element={<PickupSignatureScreen />} />
      <Route path="orders/:orderNumber/ebol/delivery" element={<DeliveryEbolScreen />} />
      <Route path="orders/:orderNumber/ebol/delivery/sign" element={<DeliverySignatureScreen />} />
      <Route path="orders/:orderNumber/ebol/pod" element={<OrderPodScreen />} />
      <Route path="orders/:orderNumber/ebol/documents/:documentKey" element={<OrderDocumentScreen />} />
      <Route path="dropoff" element={<DropoffVerifyScreen />} />
      <Route path="interstate" element={<InterstateScreen />} />
      <Route path="interstate/loading" element={<InterstateLoadingScreen />} />
      <Route path="interstate/review" element={<InterstateReviewScreen />} />
      <Route path="interstate/trip" element={<InterstateTripScreen />} />
      <Route path="interstate/unloading/:tripId" element={<InterstateUnloadingScreen />} />
      <Route path="interstate/bols" element={<InterstateBolsScreen />} />
      <Route path="interstate/bol" element={<InterstateBolScreen />} />
      <Route path="interstate/bol/:bolNumber" element={<InterstateBolScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
