import { describe, expect, it } from 'vitest';
import { canonicalJson, sha256Canonical } from './canonical-json.js';
import { DomainError } from './domain-error.js';
import { validateCreateCargoPlace } from './validation.js';

const validBody = {
  operationId: '018f6f4d-7b20-7a10-8000-000000000010',
  expectedOrderVersion: 2,
  occurredAt: '2026-09-01T10:00:00.000Z',
  orderId: '018f6f4d-7b20-7a10-8000-000000000020',
  place: {
    id: '018f6f4d-7b20-7a10-8000-000000000030',
    placeNumber: 1,
    placeCountAtCreation: 2,
    humanLabel: 'ORD-42-1-2',
  },
  measurement: {
    id: '018f6f4d-7b20-7a10-8000-000000000040',
    dimensionState: 'complete',
    length: 100,
    width: 50,
    height: 40,
    dimensionUnit: 'cm',
    weight: 25.5,
    weightUnit: 'kg',
    weightSource: 'measured',
    measuredAt: '2026-09-01T09:59:00.000Z',
  },
  label: { id: '018f6f4d-7b20-7a10-8000-000000000050' },
};

describe('CreateCargoPlace validation', () => {
  it('accepts a complete measurement', () => {
    expect(validateCreateCargoPlace(validBody)).toEqual(validBody);
  });

  it('accepts partial dimensions with an explicit reason', () => {
    const body = structuredClone(validBody);
    body.measurement.dimensionState = 'partial';
    delete (body.measurement as Partial<typeof body.measurement>).height;
    body.measurement.unknownReason = 'Package blocks one side';
    expect(validateCreateCargoPlace(body).measurement.dimensionState).toBe('partial');
  });

  it('accepts unknown dimensions and weight without substituting zero', () => {
    const body = structuredClone(validBody);
    body.measurement = {
      id: body.measurement.id,
      dimensionState: 'unknown',
      dimensionUnit: 'cm',
      weightUnit: 'kg',
      weightSource: 'unknown',
      unknownReason: 'Scale is unavailable',
      measuredAt: body.measurement.measuredAt,
    } as typeof body.measurement;
    const result = validateCreateCargoPlace(body);
    expect(result.measurement.weight).toBeUndefined();
    expect(result.measurement.length).toBeUndefined();
  });

  it('rejects partial dimensions without a reason', () => {
    const body = structuredClone(validBody);
    body.measurement.dimensionState = 'partial';
    delete (body.measurement as Partial<typeof body.measurement>).height;
    expect(() => validateCreateCargoPlace(body)).toThrow(DomainError);
  });

  it('rejects a non-v7 operation id', () => {
    expect(() => validateCreateCargoPlace({ ...validBody, operationId: '550e8400-e29b-41d4-a716-446655440000' }))
      .toThrow(/UUIDv7/);
  });

  it('rejects place number above the immutable creation count', () => {
    const body = structuredClone(validBody);
    body.place.placeNumber = 3;
    expect(() => validateCreateCargoPlace(body)).toThrow(/cannot exceed/);
  });

  it('requires weight exactly when its source is known', () => {
    const body = structuredClone(validBody);
    body.measurement.weightSource = 'unknown';
    body.measurement.unknownReason = 'Scale is unavailable';
    expect(() => validateCreateCargoPlace(body)).toThrow(/weight must be absent/);
  });

  it('rejects fields outside the versioned contract', () => {
    expect(() => validateCreateCargoPlace({ ...validBody, actorUserId: validBody.orderId }))
      .toThrow(/unsupported fields/);
  });
});

describe('canonical request hash', () => {
  it('is stable across object key order', () => {
    expect(canonicalJson({ b: 2, a: { d: 4, c: 3 } })).toBe('{"a":{"c":3,"d":4},"b":2}');
    expect(sha256Canonical({ b: 2, a: 1 })).toBe(sha256Canonical({ a: 1, b: 2 }));
  });
});
