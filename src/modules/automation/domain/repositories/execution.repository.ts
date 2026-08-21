import { Execution } from '../entities/execution.entity';

export interface ExecutionRepository {
  findById(id: string): Promise<Execution | null>;
  save(execution: Execution): Promise<void>;
  claimBatch(limit: number, now: Date): Promise<Execution[]>;
}

export const EXECUTION_REPOSITORY = Symbol('EXECUTION_REPOSITORY');
