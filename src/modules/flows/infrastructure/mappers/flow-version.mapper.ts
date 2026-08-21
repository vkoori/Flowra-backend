import { FlowVersion as PrismaFlowVersion, Prisma } from '../../../../../generated/prisma';
import { FlowVersion, FlowGraph } from '../../domain/entities/flow-version.entity';

export class FlowVersionMapper {
  static toDomain(row: PrismaFlowVersion): FlowVersion {
    return FlowVersion.fromPersistence({
      id: row.id,
      flowId: row.flowId,
      version: row.version,
      graph: row.graph as FlowGraph,
      createdAt: row.createdAt,
    });
  }

  static toPersistence(flowVersion: FlowVersion): Prisma.FlowVersionUncheckedCreateInput {
    return {
      id: flowVersion.id,
      flowId: flowVersion.flowId,
      version: flowVersion.version,
      graph: flowVersion.graph as Prisma.InputJsonValue,
      createdAt: flowVersion.createdAt,
    };
  }
}
