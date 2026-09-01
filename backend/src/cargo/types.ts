export type DimensionState = 'complete' | 'partial' | 'unknown' | 'not_measurable';
export type WeightSource = 'measured' | 'declared' | 'allocated' | 'estimated' | 'unknown';

export interface CreateCargoPlaceInput {
  operationId: string;
  expectedOrderVersion?: number;
  occurredAt: string;
  orderId: string;
  place: {
    id: string;
    placeNumber: number;
    placeCountAtCreation: number;
    humanLabel: string;
  };
  measurement: {
    id: string;
    dimensionState: DimensionState;
    length?: number;
    width?: number;
    height?: number;
    dimensionUnit: 'cm' | 'in';
    weight?: number;
    weightUnit: 'kg' | 'lb';
    weightSource: WeightSource;
    unknownReason?: string;
    measuredAt: string;
  };
  label: {
    id: string;
  };
}

export interface CommandContext {
  actorUserId: string;
  branchId: string;
  deviceId?: string;
}

export interface CreateCargoPlaceResult {
  operationId: string;
  status: 'applied';
  appliedAt: string;
  cargoPlace: {
    id: string;
    orderId: string;
    placeNumber: number;
    placeCountAtCreation: number;
    humanLabel: string;
    version: 3;
    currentMeasurement: CreateCargoPlaceInput['measurement'];
  };
  label: {
    id: string;
    labelCode: string;
    barcodePayload: string;
    barcodeFormatVersion: 1;
    status: 'active';
  };
}
