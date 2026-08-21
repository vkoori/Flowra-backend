import { Plan as PrismaPlan } from '../../../../../generated/prisma';
import { Plan } from '../../domain/entities/plan.entity';
import { PlanMapper } from './plan.mapper';

describe('PlanMapper', () => {
  const row: PrismaPlan = {
    id: 'plan-1',
    name: 'Pro',
    code: 'pro',
    monthlyMessageQuota: 5000,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  it('maps every field from a Prisma row to the domain entity', () => {
    const plan = PlanMapper.toDomain(row);

    expect(plan.id).toBe(row.id);
    expect(plan.name).toBe(row.name);
    expect(plan.code).toBe(row.code);
    expect(plan.monthlyMessageQuota).toBe(row.monthlyMessageQuota);
    expect(plan.createdAt).toBe(row.createdAt);
  });

  it('maps every field from the domain entity to a Prisma create input', () => {
    const plan = Plan.fromPersistence({
      id: row.id,
      name: row.name,
      code: row.code,
      monthlyMessageQuota: row.monthlyMessageQuota,
      createdAt: row.createdAt,
    });

    expect(PlanMapper.toPersistence(plan)).toEqual({
      id: row.id,
      name: row.name,
      code: row.code,
      monthlyMessageQuota: row.monthlyMessageQuota,
      createdAt: row.createdAt,
    });
  });

  it('round-trips domain -> persistence -> domain without losing fields', () => {
    const plan = PlanMapper.toDomain(row);
    const persisted = PlanMapper.toPersistence(plan);

    expect(
      PlanMapper.toDomain({
        id: persisted.id as string,
        name: persisted.name,
        code: persisted.code,
        monthlyMessageQuota: persisted.monthlyMessageQuota,
        createdAt: persisted.createdAt as Date,
      }),
    ).toEqual(plan);
  });
});
