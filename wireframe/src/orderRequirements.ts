// Temporary Broker comment fixtures. CRM/Spoke mapping is not connected.
const brokerComments: Record<string, string> = {
  '23343775': 'Pickup: Print the BOL before arrival. Bring a copy for the pickup contact.\nBlanket-wrap each chair before loading.',
  '23343778': 'Pickup: Arrange a two-person crew. Use the side entrance and confirm access with the contact before arrival.',
  '23343780': 'Delivery: Deliver together with order #23343775. Coordinate the same delivery appointment with the dispatcher.',
  '23343782': 'Pickup: Bring corner protectors and packing materials for the removable glass top.\nKeep the glass upright during transport.',
  '11155599': 'Delivery: Call the recipient 30 minutes before arrival. Bring the BOL for handover confirmation.',
  '11098765': 'Delivery: Use the loading dock at the rear of the building. Check in with reception before unloading.',
}

export function getOrderRequirements(order: string): string { return brokerComments[order] ?? '' }
