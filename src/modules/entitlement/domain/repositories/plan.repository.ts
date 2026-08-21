import { Plan } from '../entities/plan.entity';

export interface PlanRepository {
  findById(id: string): Promise<Plan | null>;
  findByCode(code: string): Promise<Plan | null>;
  save(plan: Plan): Promise<void>;
}

export const PLAN_REPOSITORY = Symbol('PLAN_REPOSITORY');
