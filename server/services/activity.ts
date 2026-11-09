import crypto from 'node:crypto';
import type { Activity, ActivityType } from '../../shared/types.js';
import type { Repository } from '../storage/repository.js';

export async function recordActivity(
  repo: Repository,
  researchId: string,
  type: ActivityType,
  message: string,
  meta?: Activity['meta'],
): Promise<Activity> {
  const activity: Activity = {
    id: crypto.randomUUID(),
    researchId,
    type,
    message,
    at: new Date().toISOString(),
    meta,
  };
  await repo.appendActivity(researchId, activity);
  return activity;
}
