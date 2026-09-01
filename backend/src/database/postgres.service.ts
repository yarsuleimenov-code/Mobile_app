import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class PostgresService implements OnApplicationShutdown {
  readonly pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is required');
    }
    this.pool = new Pool({ connectionString });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
