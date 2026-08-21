import { Flow as PrismaFlow } from '../../../../../generated/prisma';
import { Flow } from '../../domain/entities/flow.entity';
import { FlowMapper } from './flow.mapper';

describe('FlowMapper', () => {
  const row: PrismaFlow = {
    id: 'flow-1',
    socialAccountId: 'social-account-1',
    name: 'Welcome flow',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-05T00:00:00.000Z'),
  };

  it('maps every field from a Prisma row to the domain entity', () => {
    const flow = FlowMapper.toDomain(row);

    expect(flow.id).toBe(row.id);
    expect(flow.socialAccountId).toBe(row.socialAccountId);
    expect(flow.name).toBe(row.name);
    expect(flow.createdAt).toBe(row.createdAt);
    expect(flow.updatedAt).toBe(row.updatedAt);
  });

  it('maps every field from the domain entity to a Prisma create input', () => {
    const flow = Flow.fromPersistence({
      id: row.id,
      socialAccountId: row.socialAccountId,
      name: row.name,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });

    expect(FlowMapper.toPersistence(flow)).toEqual({
      id: row.id,
      socialAccountId: row.socialAccountId,
      name: row.name,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  });

  it('round-trips domain -> persistence -> domain without losing fields', () => {
    const flow = FlowMapper.toDomain(row);
    const persisted = FlowMapper.toPersistence(flow);

    expect(FlowMapper.toDomain({ ...row, ...persisted } as unknown as PrismaFlow)).toEqual(flow);
  });
});
