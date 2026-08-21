import { AuditLog } from '../entities/audit-log.entity';

export interface AuditLogRepository {
  findById(id: string): Promise<AuditLog | null>;
  findByTarget(targetType: string, targetId: string): Promise<AuditLog[]>;
  create(log: AuditLog): Promise<void>;
}

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');
