import { randomUUID } from 'node:crypto';
import { TransferAlreadyResolvedError } from '../errors/transfer-already-resolved.error';

export type TransferStatus = 'pending' | 'approved' | 'rejected' | 'expired';

interface AccountTransferProps {
  id: string;
  socialAccountId: string;
  fromTenureId: string | null;
  toUserId: string;
  status: TransferStatus;
  objectionDeadlineAt: Date;
  createdAt: Date;
  resolvedAt: Date | null;
}

export class AccountTransfer {
  private constructor(private readonly props: AccountTransferProps) {}

  static create(
    props: {
      socialAccountId: string;
      fromTenureId: string | null;
      toUserId: string;
      objectionDeadlineAt: Date;
    },
    now: Date,
  ): AccountTransfer {
    return new AccountTransfer({
      id: randomUUID(),
      socialAccountId: props.socialAccountId,
      fromTenureId: props.fromTenureId,
      toUserId: props.toUserId,
      status: 'pending',
      objectionDeadlineAt: props.objectionDeadlineAt,
      createdAt: now,
      resolvedAt: null,
    });
  }

  static fromPersistence(props: AccountTransferProps): AccountTransfer {
    return new AccountTransfer(props);
  }

  get id(): string {
    return this.props.id;
  }

  get socialAccountId(): string {
    return this.props.socialAccountId;
  }

  get fromTenureId(): string | null {
    return this.props.fromTenureId;
  }

  get toUserId(): string {
    return this.props.toUserId;
  }

  get status(): TransferStatus {
    return this.props.status;
  }

  get objectionDeadlineAt(): Date {
    return this.props.objectionDeadlineAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get resolvedAt(): Date | null {
    return this.props.resolvedAt;
  }

  approve(resolvedAt: Date): void {
    this.resolve('approved', resolvedAt);
  }

  reject(resolvedAt: Date): void {
    this.resolve('rejected', resolvedAt);
  }

  expire(resolvedAt: Date): void {
    this.resolve('expired', resolvedAt);
  }

  private resolve(status: TransferStatus, resolvedAt: Date): void {
    if (this.props.status !== 'pending') {
      throw new TransferAlreadyResolvedError(this.props.id);
    }
    this.props.status = status;
    this.props.resolvedAt = resolvedAt;
  }
}
