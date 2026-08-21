import { Flow } from '../entities/flow.entity';

export interface FlowRepository {
  findById(id: string): Promise<Flow | null>;
  findBySocialAccountId(socialAccountId: string): Promise<Flow[]>;
  save(flow: Flow): Promise<void>;
}

export const FLOW_REPOSITORY = Symbol('FLOW_REPOSITORY');
