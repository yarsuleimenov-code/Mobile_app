import { Module } from '@nestjs/common';
import { PostgresService } from '../database/postgres.service.js';
import { CargoController } from './cargo.controller.js';
import { CARGO_PLACE_REPOSITORY } from './cargo-place.repository.js';
import { CommandContextProvider } from './command-context.provider.js';
import { CreateCargoPlaceService } from './create-cargo-place.service.js';
import { PostgresCargoPlaceRepository } from './postgres-cargo-place.repository.js';

@Module({
  controllers: [CargoController],
  providers: [
    PostgresService,
    CommandContextProvider,
    CreateCargoPlaceService,
    { provide: CARGO_PLACE_REPOSITORY, useClass: PostgresCargoPlaceRepository },
  ],
})
export class CargoModule {}
