import { describe, expect, it } from 'vitest';
import type { CargoPlaceRepository } from './cargo-place.repository.js';
import type { CommandContextProvider } from './command-context.provider.js';
import { CreateCargoPlaceService } from './create-cargo-place.service.js';
import type { CommandContext, CreateCargoPlaceResult } from './types.js';

describe('CreateCargoPlaceService', () => {
  it('passes validated input, context and a stable hash to the repository', async () => {
    const context: CommandContext = {
      actorUserId: '018f6f4d-7b20-7a10-8000-000000000001',
      branchId: '018f6f4d-7b20-7a10-8000-000000000002',
    };
    let capturedHash = '';
    const repository: CargoPlaceRepository = {
      async create(input, receivedContext, requestHash) {
        expect(receivedContext).toEqual(context);
        capturedHash = requestHash;
        return {
          operationId: input.operationId,
          status: 'applied',
          appliedAt: '2026-09-01T10:01:00.000Z',
          cargoPlace: {
            ...input.place,
            orderId: input.orderId,
            version: 3,
            currentMeasurement: input.measurement,
          },
          label: {
            id: input.label.id,
            labelCode: input.place.humanLabel,
            barcodePayload: `ZB1:${input.place.id}`,
            barcodeFormatVersion: 1,
            status: 'active',
          },
        } satisfies CreateCargoPlaceResult;
      },
    };
    const contextProvider = { get: () => context } as CommandContextProvider;
    const service = new CreateCargoPlaceService(repository, contextProvider);
    const body = {
      operationId: '018f6f4d-7b20-7a10-8000-000000000010',
      occurredAt: '2026-09-01T10:00:00.000Z',
      orderId: '018f6f4d-7b20-7a10-8000-000000000020',
      place: { id: '018f6f4d-7b20-7a10-8000-000000000030', placeNumber: 1, placeCountAtCreation: 1, humanLabel: 'ORD-42-1-1' },
      measurement: {
        id: '018f6f4d-7b20-7a10-8000-000000000040', dimensionState: 'complete',
        length: 1, width: 2, height: 3, dimensionUnit: 'cm', weight: 4, weightUnit: 'kg',
        weightSource: 'measured', measuredAt: '2026-09-01T09:59:00.000Z',
      },
      label: { id: '018f6f4d-7b20-7a10-8000-000000000050' },
    };

    const first = await service.execute(body);
    const firstHash = capturedHash;
    const second = await service.execute(structuredClone(body));
    expect(second).toEqual(first);
    expect(capturedHash).toBe(firstHash);
    expect(capturedHash).toMatch(/^[0-9a-f]{64}$/);
  });
});
