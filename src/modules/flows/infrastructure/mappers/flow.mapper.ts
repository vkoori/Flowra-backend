import { Flow as PrismaFlow, Prisma } from '../../../../../generated/prisma';
import { Flow } from '../../domain/entities/flow.entity';

export class FlowMapper {
  static toDomain(row: PrismaFlow): Flow {
    return Flow.fromPersistence({
      id: row.id,
      socialAccountId: row.socialAccountId,
      name: row.name,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(flow: Flow): Prisma.FlowCreateInput {
    return {
      id: flow.id,
      socialAccountId: flow.socialAccountId,
      name: flow.name,
      createdAt: flow.createdAt,
      updatedAt: flow.updatedAt,
    };
  }
}
