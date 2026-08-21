import { Prisma, Plan as PrismaPlan } from '../../../../../generated/prisma';
import { Plan } from '../../domain/entities/plan.entity';

export class PlanMapper {
  static toDomain(row: PrismaPlan): Plan {
    return Plan.fromPersistence({
      id: row.id,
      name: row.name,
      code: row.code,
      monthlyMessageQuota: row.monthlyMessageQuota,
      createdAt: row.createdAt,
    });
  }

  static toPersistence(plan: Plan): Prisma.PlanCreateInput {
    return {
      id: plan.id,
      name: plan.name,
      code: plan.code,
      monthlyMessageQuota: plan.monthlyMessageQuota,
      createdAt: plan.createdAt,
    };
  }
}
