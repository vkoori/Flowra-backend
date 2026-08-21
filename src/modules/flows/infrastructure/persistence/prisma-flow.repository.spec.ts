import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Flow } from '../../domain/entities/flow.entity';
import { FlowMapper } from '../mappers/flow.mapper';
import { PrismaFlowRepository } from './prisma-flow.repository';

function makeFlow(): Flow {
  return Flow.create(
    { socialAccountId: 'social-account-1', name: 'Welcome flow' },
    new Date('2026-01-01T00:00:00.000Z'),
  );
}

describe('PrismaFlowRepository', () => {
  describe('findById()', () => {
    it('maps the row to a domain entity when found', async () => {
      const flow = makeFlow();
      const row = { ...FlowMapper.toPersistence(flow) };
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { flow: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaFlowRepository(prisma);

      const result = await repository.findById(flow.id);

      expect(findUnique).toHaveBeenCalledWith({ where: { id: flow.id } });
      expect(result).toEqual(flow);
    });

    it('returns null when no row is found', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { flow: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaFlowRepository(prisma);

      const result = await repository.findById('missing-id');

      expect(result).toBeNull();
    });
  });

  describe('findBySocialAccountId()', () => {
    it('queries by socialAccountId and maps every row', async () => {
      const flow = makeFlow();
      const row = { ...FlowMapper.toPersistence(flow) };
      const findMany = jest.fn().mockResolvedValue([row]);
      const prisma = { flow: { findMany } } as unknown as PrismaService;
      const repository = new PrismaFlowRepository(prisma);

      const result = await repository.findBySocialAccountId('social-account-1');

      expect(findMany).toHaveBeenCalledWith({ where: { socialAccountId: 'social-account-1' } });
      expect(result).toEqual([flow]);
    });

    it('returns an empty array when no rows are found', async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      const prisma = { flow: { findMany } } as unknown as PrismaService;
      const repository = new PrismaFlowRepository(prisma);

      const result = await repository.findBySocialAccountId('social-account-1');

      expect(result).toEqual([]);
    });
  });

  describe('save()', () => {
    it('upserts on the flow id', async () => {
      const flow = makeFlow();
      const upsert = jest.fn().mockResolvedValue(undefined);
      const prisma = { flow: { upsert } } as unknown as PrismaService;
      const repository = new PrismaFlowRepository(prisma);

      await repository.save(flow);

      const data = FlowMapper.toPersistence(flow);
      expect(upsert).toHaveBeenCalledWith({
        where: { id: flow.id },
        create: data,
        update: data,
      });
    });
  });
});
