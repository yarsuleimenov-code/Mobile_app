import { Injectable } from '@nestjs/common';
import { DomainError } from './domain-error.js';
import type { CommandContext } from './types.js';
import { UUID_V7_PATTERN } from './uuid-v7.js';

@Injectable()
export class CommandContextProvider {
  get(): CommandContext {
    if (process.env.NODE_ENV === 'production') {
      throw new DomainError('auth_adapter_missing', 'Production identity adapter is not configured', 503, true);
    }
    const actorUserId = process.env.DEV_ACTOR_USER_ID;
    const branchId = process.env.DEV_BRANCH_ID;
    const deviceId = process.env.DEV_DEVICE_ID;
    if (!actorUserId || !branchId || !UUID_V7_PATTERN.test(actorUserId) || !UUID_V7_PATTERN.test(branchId)) {
      throw new DomainError('dev_context_missing', 'DEV_ACTOR_USER_ID and DEV_BRANCH_ID must be UUIDv7 values', 503, true);
    }
    if (deviceId && !UUID_V7_PATTERN.test(deviceId)) {
      throw new DomainError('dev_context_invalid', 'DEV_DEVICE_ID must be a UUIDv7 value', 503, true);
    }
    return { actorUserId: actorUserId.toLowerCase(), branchId: branchId.toLowerCase(), ...(deviceId ? { deviceId: deviceId.toLowerCase() } : {}) };
  }
}
