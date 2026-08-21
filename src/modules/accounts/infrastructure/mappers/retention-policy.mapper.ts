import { RetentionPolicy } from '../../domain/entities/retention-policy.entity';

export interface RetentionPolicyRow {
  id: string;
  socialAccountId: string;
  dataClass: string;
  ttlDays: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export class RetentionPolicyMapper {
  static toDomain(row: RetentionPolicyRow): RetentionPolicy {
    return RetentionPolicy.fromPersistence({
      id: row.id,
      socialAccountId: row.socialAccountId,
      dataClass: row.dataClass,
      ttlDays: row.ttlDays,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(retentionPolicy: RetentionPolicy): RetentionPolicyRow {
    return {
      id: retentionPolicy.id,
      socialAccountId: retentionPolicy.socialAccountId,
      dataClass: retentionPolicy.dataClass,
      ttlDays: retentionPolicy.ttlDays,
      createdAt: retentionPolicy.createdAt,
      updatedAt: retentionPolicy.updatedAt,
    };
  }
}
