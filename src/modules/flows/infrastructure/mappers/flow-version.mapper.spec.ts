import { FlowVersion as PrismaFlowVersion } from '../../../../../generated/prisma';
import { FlowVersion } from '../../domain/entities/flow-version.entity';
import { FlowVersionMapper } from './flow-version.mapper';

describe('FlowVersionMapper', () => {
  const graph = { nodes: [{ id: 'step-1', type: 'send', text: 'hi' }], edges: [] };

  const row: PrismaFlowVersion = {
    id: 'flow-version-1',
    flowId: 'flow-1',
    version: 1,
    graph,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  it('maps every field from a Prisma row to the domain entity, including graph', () => {
    const flowVersion = FlowVersionMapper.toDomain(row);

    expect(flowVersion.id).toBe(row.id);
    expect(flowVersion.flowId).toBe(row.flowId);
    expect(flowVersion.version).toBe(row.version);
    expect(flowVersion.graph).toEqual(graph);
    expect(flowVersion.createdAt).toBe(row.createdAt);
  });

  it('maps every field from the domain entity to a Prisma create input', () => {
    const flowVersion = FlowVersion.fromPersistence({
      id: row.id,
      flowId: row.flowId,
      version: row.version,
      graph,
      createdAt: row.createdAt,
    });

    expect(FlowVersionMapper.toPersistence(flowVersion)).toEqual({
      id: row.id,
      flowId: row.flowId,
      version: row.version,
      graph,
      createdAt: row.createdAt,
    });
  });

  it('round-trips domain -> persistence -> domain without losing the graph', () => {
    const flowVersion = FlowVersionMapper.toDomain(row);
    const persisted = FlowVersionMapper.toPersistence(flowVersion);

    expect(
      FlowVersionMapper.toDomain({ ...row, ...persisted } as unknown as PrismaFlowVersion),
    ).toEqual(flowVersion);
  });
});
