import { describe, expect, it } from 'vitest'
import { calculatePieces, calculateVolume, defaultDimensionGroups, normalizeOrderNumber } from './cargoDomain'

describe('cargo record calculations', () => {
  it('matches the accepted pickup example', () => {
    expect(calculatePieces(defaultDimensionGroups)).toBe(11)
    expect(calculateVolume(defaultDimensionGroups)).toBe(273.44)
  })

  it('normalizes order input', () => {
    expect(normalizeOrderNumber('#11155599')).toBe('11155599')
  })
})
