import { Module } from '@nestjs/common';
import { CargoModule } from './cargo/cargo.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [CargoModule],
  controllers: [HealthController],
})
export class AppModule {}
