import type { CommandContext, CreateCargoPlaceInput, CreateCargoPlaceResult } from './types.js';

export const CARGO_PLACE_REPOSITORY = Symbol('CARGO_PLACE_REPOSITORY');

export interface CargoPlaceRepository {
  create(input: CreateCargoPlaceInput, context: CommandContext, requestHash: string): Promise<CreateCargoPlaceResult>;
}
