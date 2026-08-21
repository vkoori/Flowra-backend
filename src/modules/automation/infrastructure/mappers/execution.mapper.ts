import { Execution as PrismaExecution, Prisma } from '../../../../../generated/prisma';
import {
  Execution,
  ExecutionOriginType,
  ExecutionStatus,
} from '../../domain/entities/execution.entity';

// snake_case: raw $queryRaw result, not Prisma's camelCase client output.
export interface RawExecutionRow {
  id: string;
  origin_type: string;
  origin_id: string;
  event_id: string;
  action_index: number;
  status: string;
  action_type: string;
  action_params: unknown;
  scheduled_at: Date;
  next_attempt_at: Date | null;
  attempts: number;
  max_attempts: number;
  dead_letter_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export class ExecutionMapper {
  static toDomain(row: PrismaExecution): Execution {
    return Execution.fromPersistence({
      id: row.id,
      originType: row.originType,
      originId: row.originId,
      eventId: row.eventId,
      actionIndex: row.actionIndex,
      status: row.status,
      actionType: row.actionType,
      actionParams: row.actionParams as Record<string, unknown>,
      scheduledAt: row.scheduledAt,
      nextAttemptAt: row.nextAttemptAt,
      attempts: row.attempts,
      maxAttempts: row.maxAttempts,
      deadLetterReason: row.deadLetterReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toDomainFromRaw(row: RawExecutionRow): Execution {
    return Execution.fromPersistence({
      id: row.id,
      originType: row.origin_type as ExecutionOriginType,
      originId: row.origin_id,
      eventId: row.event_id,
      actionIndex: row.action_index,
      status: row.status as ExecutionStatus,
      actionType: row.action_type,
      actionParams: row.action_params as Record<string, unknown>,
      scheduledAt: row.scheduled_at,
      nextAttemptAt: row.next_attempt_at,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      deadLetterReason: row.dead_letter_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static toPersistence(execution: Execution): Prisma.ExecutionCreateInput {
    return {
      id: execution.id,
      originType: execution.originType,
      originId: execution.originId,
      eventId: execution.eventId,
      actionIndex: execution.actionIndex,
      status: execution.status,
      actionType: execution.actionType,
      actionParams: execution.actionParams as Prisma.InputJsonValue,
      scheduledAt: execution.scheduledAt,
      nextAttemptAt: execution.nextAttemptAt,
      attempts: execution.attempts,
      maxAttempts: execution.maxAttempts,
      deadLetterReason: execution.deadLetterReason,
      createdAt: execution.createdAt,
      updatedAt: execution.updatedAt,
    };
  }
}
