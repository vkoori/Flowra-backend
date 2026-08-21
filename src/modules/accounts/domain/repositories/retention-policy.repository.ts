import { RetentionPolicy } from '../entities/retention-policy.entity';

export interface RetentionPolicyRepository {
  findById(id: string): Promise<RetentionPolicy | null>;
  findBySocialAccountId(socialAccountId: string): Promise<RetentionPolicy[]>;
  save(retentionPolicy: RetentionPolicy): Promise<void>;
}

export const RETENTION_POLICY_REPOSITORY = Symbol('RETENTION_POLICY_REPOSITORY');
