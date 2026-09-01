import { Body, Controller, HttpException, Post } from '@nestjs/common';
import { CreateCargoPlaceService } from './create-cargo-place.service.js';
import { DomainError } from './domain-error.js';
import type { CreateCargoPlaceResult } from './types.js';

@Controller('cargo-places')
export class CargoController {
  constructor(private readonly createCargoPlace: CreateCargoPlaceService) {}

  @Post()
  async create(@Body() body: unknown): Promise<CreateCargoPlaceResult> {
    try {
      return await this.createCargoPlace.execute(body);
    } catch (error) {
      if (error instanceof DomainError) {
        throw new HttpException(
          { code: error.code, message: error.message, retryable: error.retryable },
          error.httpStatus,
        );
      }
      throw error;
    }
  }
}
