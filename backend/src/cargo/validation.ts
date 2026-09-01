import { DomainError } from './domain-error.js';
import type { CreateCargoPlaceInput, DimensionState, WeightSource } from './types.js';
import { UUID_V7_PATTERN } from './uuid-v7.js';

const DIMENSION_STATES = new Set<DimensionState>(['complete', 'partial', 'unknown', 'not_measurable']);
const WEIGHT_SOURCES = new Set<WeightSource>(['measured', 'declared', 'allocated', 'estimated', 'unknown']);
const HUMAN_LABEL_PATTERN = /^[A-Z0-9-]{4,64}$/;

function invalid(message: string): never {
  throw new DomainError('validation_failed', message, 400);
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    invalid(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

function allowedKeys(value: Record<string, unknown>, field: string, keys: readonly string[]): void {
  const allowed = new Set(keys);
  const unexpected = Object.keys(value).filter((key) => !allowed.has(key));
  if (unexpected.length > 0) invalid(`${field} contains unsupported fields: ${unexpected.join(', ')}`);
}

function string(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') invalid(`${field} must be a non-empty string`);
  return value;
}

function uuidV7(value: unknown, field: string): string {
  const parsed = string(value, field);
  if (!UUID_V7_PATTERN.test(parsed)) invalid(`${field} must be a UUIDv7`);
  return parsed.toLowerCase();
}

function isoDate(value: unknown, field: string): string {
  const parsed = string(value, field);
  const date = new Date(parsed);
  if (Number.isNaN(date.getTime()) || date.toISOString() !== parsed) {
    invalid(`${field} must be an ISO-8601 UTC timestamp`);
  }
  return parsed;
}

function integer(value: unknown, field: string): number {
  if (!Number.isInteger(value) || (value as number) <= 0) invalid(`${field} must be a positive integer`);
  return value as number;
}

function optionalNumber(value: unknown, field: string, allowZero: boolean): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) {
    invalid(`${field} must be ${allowZero ? 'zero or a positive number' : 'a positive number'}`);
  }
  return value;
}

export function validateCreateCargoPlace(value: unknown): CreateCargoPlaceInput {
  const body = record(value, 'body');
  const place = record(body.place, 'place');
  const measurement = record(body.measurement, 'measurement');
  const label = record(body.label, 'label');
  allowedKeys(body, 'body', ['operationId', 'expectedOrderVersion', 'occurredAt', 'orderId', 'place', 'measurement', 'label']);
  allowedKeys(place, 'place', ['id', 'placeNumber', 'placeCountAtCreation', 'humanLabel']);
  allowedKeys(measurement, 'measurement', [
    'id', 'dimensionState', 'length', 'width', 'height', 'dimensionUnit',
    'weight', 'weightUnit', 'weightSource', 'unknownReason', 'measuredAt',
  ]);
  allowedKeys(label, 'label', ['id']);
  const dimensionState = string(measurement.dimensionState, 'measurement.dimensionState') as DimensionState;
  const weightSource = string(measurement.weightSource, 'measurement.weightSource') as WeightSource;
  if (!DIMENSION_STATES.has(dimensionState)) invalid('measurement.dimensionState is unsupported');
  if (!WEIGHT_SOURCES.has(weightSource)) invalid('measurement.weightSource is unsupported for initial measurement');

  const length = optionalNumber(measurement.length, 'measurement.length', false);
  const width = optionalNumber(measurement.width, 'measurement.width', false);
  const height = optionalNumber(measurement.height, 'measurement.height', false);
  const dimensionCount = [length, width, height].filter((entry) => entry !== undefined).length;
  if (dimensionState === 'complete' && dimensionCount !== 3) invalid('complete dimensions require length, width and height');
  if (dimensionState === 'partial' && (dimensionCount < 1 || dimensionCount > 2)) invalid('partial dimensions require one or two values');
  if ((dimensionState === 'unknown' || dimensionState === 'not_measurable') && dimensionCount !== 0) {
    invalid(`${dimensionState} dimensions cannot contain values`);
  }

  const weight = optionalNumber(measurement.weight, 'measurement.weight', true);
  if ((weightSource === 'unknown') !== (weight === undefined)) {
    invalid('weight must be absent exactly when weightSource is unknown');
  }
  const unknownReason = measurement.unknownReason === undefined
    ? undefined
    : string(measurement.unknownReason, 'measurement.unknownReason').trim();
  if ((dimensionState !== 'complete' || weightSource === 'unknown') && !unknownReason) {
    invalid('unknownReason is required for incomplete dimensions or unknown weight');
  }

  const dimensionUnit = string(measurement.dimensionUnit, 'measurement.dimensionUnit');
  if (dimensionUnit !== 'cm' && dimensionUnit !== 'in') invalid('measurement.dimensionUnit must be cm or in');
  const weightUnit = string(measurement.weightUnit, 'measurement.weightUnit');
  if (weightUnit !== 'kg' && weightUnit !== 'lb') invalid('measurement.weightUnit must be kg or lb');
  const placeNumber = integer(place.placeNumber, 'place.placeNumber');
  const placeCountAtCreation = integer(place.placeCountAtCreation, 'place.placeCountAtCreation');
  if (placeNumber > placeCountAtCreation) invalid('place.placeNumber cannot exceed place.placeCountAtCreation');
  const humanLabel = string(place.humanLabel, 'place.humanLabel').trim();
  if (!HUMAN_LABEL_PATTERN.test(humanLabel)) invalid('place.humanLabel must contain 4-64 uppercase letters, digits or hyphens');

  const expectedOrderVersion = body.expectedOrderVersion === undefined
    ? undefined
    : integer(body.expectedOrderVersion, 'expectedOrderVersion');

  return {
    operationId: uuidV7(body.operationId, 'operationId'),
    ...(expectedOrderVersion === undefined ? {} : { expectedOrderVersion }),
    occurredAt: isoDate(body.occurredAt, 'occurredAt'),
    orderId: uuidV7(body.orderId, 'orderId'),
    place: {
      id: uuidV7(place.id, 'place.id'),
      placeNumber,
      placeCountAtCreation,
      humanLabel,
    },
    measurement: {
      id: uuidV7(measurement.id, 'measurement.id'),
      dimensionState,
      ...(length === undefined ? {} : { length }),
      ...(width === undefined ? {} : { width }),
      ...(height === undefined ? {} : { height }),
      dimensionUnit,
      ...(weight === undefined ? {} : { weight }),
      weightUnit,
      weightSource,
      ...(unknownReason === undefined ? {} : { unknownReason }),
      measuredAt: isoDate(measurement.measuredAt, 'measurement.measuredAt'),
    },
    label: { id: uuidV7(label.id, 'label.id') },
  };
}
