import { expect, it } from 'vitest'
import { googleMapsDirectionsUrl } from './externalNavigationDomain'

it('opens driving directions for the exact address, without origin or order data', () => {
  const url = new URL(googleMapsDirectionsUrl(' 455 Concord Avenue, Belmont, MA 02478, USA ')!)
  expect(url.origin + url.pathname).toBe('https://www.google.com/maps/dir/')
  expect(Object.fromEntries(url.searchParams)).toEqual({ api: '1', destination: '455 Concord Avenue, Belmont, MA 02478, USA', travelmode: 'driving', dir_action: 'navigate' })
})
it('encodes special characters and non-Latin addresses without changing the destination', () => {
  const address = '12 A&B Street #3, Montréal / Québec? USA'
  expect(new URL(googleMapsDirectionsUrl(address)!).searchParams.get('destination')).toBe(address)
})
it('does not generate a navigation link for missing or whitespace-only addresses', () => {
  expect(googleMapsDirectionsUrl('')).toBeUndefined()
  expect(googleMapsDirectionsUrl(' \n ')).toBeUndefined()
})
