import { randomUUID } from 'node:crypto';

export type FlowGraph = Record<string, unknown>;

interface FlowVersionProps {
  id: string;
  flowId: string;
  version: number;
  graph: FlowGraph;
  createdAt: Date;
}

export class FlowVersion {
  private constructor(private readonly props: FlowVersionProps) {}

  static create(
    props: { flowId: string; version: number; graph: FlowGraph },
    now: Date,
  ): FlowVersion {
    return new FlowVersion({
      id: randomUUID(),
      flowId: props.flowId,
      version: props.version,
      graph: props.graph,
      createdAt: now,
    });
  }

  static fromPersistence(props: FlowVersionProps): FlowVersion {
    return new FlowVersion(props);
  }

  get id(): string {
    return this.props.id;
  }

  get flowId(): string {
    return this.props.flowId;
  }

  get version(): number {
    return this.props.version;
  }

  get graph(): FlowGraph {
    return this.props.graph;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
