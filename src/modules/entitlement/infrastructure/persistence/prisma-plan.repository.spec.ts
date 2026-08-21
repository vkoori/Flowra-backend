import { Plan as PrismaPlan } from '../../../../../generated/prisma';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Plan } from '../../domain/entities/plan.entity';
import { PlanMapper } from '../mappers/plan.mapper';
import { PrismaPlanRepository } from './prisma-plan.repository';

function makeRow(): PrismaPlan {
  return {
    id: 'plan-1',
    name: 'Pro',
    code: 'pro',
    monthlyMessageQuota: 5000,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function makePlan(): Plan {
  return Plan.fromPersistence(makeRow());
}

describe('PrismaPlanRepository', () => {
  describe('findById()', () => {
    it('calls findUnique with the id and maps the result to a domain entity', async () => {
      const row = makeRow();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { plan: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaPlanRepository(prisma);

      const result = await repository.findById('plan-1');

      expect(findUnique).toHaveBeenCalledWith({ where: { id: 'plan-1' } });
      expect(result).toEqual(PlanMapper.toDomain(row));
    });

    it('returns null when Prisma finds no row', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { plan: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaPlanRepository(prisma);

      await expect(repository.findById('missing')).resolves.toBeNull();
    });
  });

  describe('findByCode()', () => {
    it('calls findUnique with the code and maps the result to a domain entity', async () => {
      const row = makeRow();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { plan: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaPlanRepository(prisma);

      const result = await repository.findByCode('pro');

      expect(findUnique).toHaveBeenCalledWith({ where: { code: 'pro' } });
      expect(result).toEqual(PlanMapper.toDomain(row));
    });

    it('returns null when Prisma finds no row', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { plan: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaPlanRepository(prisma);

      await expect(repository.findByCode('missing')).resolves.toBeNull();
    });
  });

  describe('save()', () => {
    it('upserts by id using the mapped persistence shape for both create and update', async () => {
      const upsert = jest.fn().mockResolvedValue(undefined);
      const prisma = { plan: { upsert } } as unknown as PrismaService;
      const repository = new PrismaPlanRepository(prisma);
      const plan = makePlan();
      const data = PlanMapper.toPersistence(plan);

      await repository.save(plan);

      expect(upsert).toHaveBeenCalledWith({
        where: { id: plan.id },
        create: data,
        update: data,
      });
    });
  });
});
