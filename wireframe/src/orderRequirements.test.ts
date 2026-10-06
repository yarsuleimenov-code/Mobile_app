import { describe, expect, it } from 'vitest'
import { getOrderRequirements } from './orderRequirements'
import { orderSummaryText } from './teamContactsDomain'

describe('order Requirements from Broker comment fixtures', () => {
  it('keeps distinct instructions per order and preserves line breaks', () => {
    expect(getOrderRequirements('23343775')).toContain('Print the BOL')
    expect(getOrderRequirements('23343775')).toContain('\nBlanket-wrap')
    expect(getOrderRequirements('23343780')).toContain('together with order #23343775')
    expect(getOrderRequirements('23343778')).not.toBe(getOrderRequirements('23343775'))
  })
  it('does not fabricate requirements for orders without a Broker comment', () => {
    expect(getOrderRequirements('11076543')).toBe('')
    expect(getOrderRequirements('999999')).toBe('')
  })
  it('copies requirements separately from handling and the order note', () => {
    const context = { order: '23343775', name: 'Dining Chair', quantity: 3, workDate: '08/21/2026', handling: 'Fragile', comment: 'Ground floor', requirements: getOrderRequirements('23343775') }
    expect(orderSummaryText(context)).toContain(`Requirements: ${context.requirements}\nHandling: Fragile\nOrder note: Ground floor`)
    expect(orderSummaryText({ ...context, requirements: '' })).not.toContain('Requirements:')
  })
})
