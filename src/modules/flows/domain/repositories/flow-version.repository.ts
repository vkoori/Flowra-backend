import { FlowVersion } from '../entities/flow-version.entity';

export interface FlowVersionRepository {
  findById(id: string): Promise<FlowVersion | null>;
  findLatestByFlowId(flowId: string): Promise<FlowVersion | null>;
  create(flowVersion: FlowVersion): Promise<void>;
}

export const FLOW_VERSION_REPOSITORY = Symbol('FLOW_VERSION_REPOSITORY');
