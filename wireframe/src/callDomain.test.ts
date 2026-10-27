import { describe, expect, it } from 'vitest'
import { callOrderCandidates, filterCalls, initialCustomerCalls, markCallsSeen } from './callDomain'
import { initialCommunicationThreads } from './communicationDomain'

describe('Customer call history', () => {
  const incoming = initialCustomerCalls[0]
  const laura = initialCommunicationThreads[0]
  const anotherOrder = { ...laura, id: 'another', orderNumber: 'other-order' }

  it('prefers route orders but preserves ambiguous contact matches for explicit choice', () => {
    const threads = [laura, anotherOrder]
    expect(callOrderCandidates(incoming, threads, [anotherOrder.orderNumber])).toEqual([anotherOrder])
    expect(callOrderCandidates(incoming, threads, threads.map((thread) => thread.orderNumber))).toEqual(threads)
    expect(callOrderCandidates(incoming, threads, [])).toEqual(threads)
    expect(callOrderCandidates({ ...incoming, customerPhone: '+1 000 000 0000' }, threads, [])).toEqual([])
  })

  it('does not remap a recorded order to a more recent order for the same contact', () => {
    expect(callOrderCandidates({ ...incoming, orderNumber: laura.orderNumber }, [laura, anotherOrder], [anotherOrder.orderNumber])).toEqual([laura])
  })

  it('viewing missed calls only clears new indicators, without resolving or deleting calls', () => {
    const seen = markCallsSeen(initialCustomerCalls)
    expect(seen.filter((call) => !call.seen)).toHaveLength(0)
    expect(filterCalls(seen, '', true).map((call) => call.id)).toEqual(['call-1', 'call-3'])
    expect(initialCustomerCalls[0].seen).toBe(false)
    expect(seen[0].outcome).toBe('missed')
  })

  it('searches suggested orders and combines query with the missed filter', () => {
    expect(filterCalls(initialCustomerCalls, laura.orderNumber, true, [laura], [laura.orderNumber])).toEqual([incoming])
    expect(filterCalls(initialCustomerCalls, 'Michael', true)).toEqual([])
    expect(filterCalls(initialCustomerCalls, 'no match', false)).toEqual([])
  })
})
