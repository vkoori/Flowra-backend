import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { FlowVersion } from '../../domain/entities/flow-version.entity';
import { FlowVersionMapper } from '../mappers/flow-version.mapper';
import { PrismaFlowVersionRepository } from './prisma-flow-version.repository';

function makeFlowVersion(): FlowVersion {
  return FlowVersion.create(
    { flowId: 'flow-1', version: 1, graph: { nodes: [], edges: [] } },
    new Date('2026-01-01T00:00:00.000Z'),
  );
}

describe('PrismaFlowVersionRepository', () => {
  describe('findById()', () => {
    it('maps the row to a domain entity when found', async () => {
      const flowVersion = makeFlowVersion();
      const row = { ...FlowVersionMapper.toPersistence(flowVersion) };
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { flowVersion: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaFlowVersionRepository(prisma);

      const result = await repository.findById(flowVersion.id);

      expect(findUnique).toHaveBeenCalledWith({ where: { id: flowVersion.id } });
      expect(result).toEqual(flowVersion);
    });

    it('returns null when no row is found', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { flowVersion: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaFlowVersionRepository(prisma);

      const result = await repository.findById('missing-id');

      expect(result).toBeNull();
    });
  });

  describe('findLatestByFlowId()', () => {
    it('queries with the flowId filter ordered by version descending', async () => {
      const flowVersion = makeFlowVersion();
      const row = { ...FlowVersionMapper.toPersistence(flowVersion) };
      const findFirst = jest.fn().mockResolvedValue(row);
      const prisma = { flowVersion: { findFirst } } as unknown as PrismaService;
      const repository = new PrismaFlowVersionRepository(prisma);

      const result = await repository.findLatestByFlowId('flow-1');

      expect(findFirst).toHaveBeenCalledWith({
        where: { flowId: 'flow-1' },
        orderBy: { version: 'desc' },
      });
      expect(result).toEqual(flowVersion);
    });

    it('returns null when the flow has no versions', async () => {
      const findFirst = jest.fn().mockResolvedValue(null);
      const prisma = { flowVersion: { findFirst } } as unknown as PrismaService;
      const repository = new PrismaFlowVersionRepository(prisma);

      const result = await repository.findLatestByFlowId('flow-1');

      expect(result).toBeNull();
    });
  });

  describe('create()', () => {
    it('calls prisma.flowVersion.create, not upsert', async () => {
      const flowVersion = makeFlowVersion();
      const create = jest.fn().mockResolvedValue(undefined);
      const upsert = jest.fn();
      const prisma = { flowVersion: { create, upsert } } as unknown as PrismaService;
      const repository = new PrismaFlowVersionRepository(prisma);

      await repository.create(flowVersion);

      expect(create).toHaveBeenCalledWith({ data: FlowVersionMapper.toPersistence(flowVersion) });
      expect(upsert).not.toHaveBeenCalled();
    });
  });
});
