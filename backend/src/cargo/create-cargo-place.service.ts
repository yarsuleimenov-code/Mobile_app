import { Inject, Injectable } from '@nestjs/common';
import { sha256Canonical } from './canonical-json.js';
import { CARGO_PLACE_REPOSITORY, type CargoPlaceRepository } from './cargo-place.repository.js';
import { CommandContextProvider } from './command-context.provider.js';
import type { CreateCargoPlaceResult } from './types.js';
import { validateCreateCargoPlace } from './validation.js';

@Injectable()
export class CreateCargoPlaceService {
  constructor(
    @Inject(CARGO_PLACE_REPOSITORY) private readonly repository: CargoPlaceRepository,
    private readonly commandContext: CommandContextProvider,
  ) {}

  async execute(body: unknown): Promise<CreateCargoPlaceResult> {
    const input = validateCreateCargoPlace(body);
    const context = this.commandContext.get();
    const requestHash = sha256Canonical({ context, input });
    return this.repository.create(input, context, requestHash);
  }
}
