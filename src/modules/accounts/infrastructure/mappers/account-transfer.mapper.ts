import { AccountTransfer, TransferStatus } from '../../domain/entities/account-transfer.entity';

export interface AccountTransferRow {
  id: string;
  socialAccountId: string;
  fromTenureId: string | null;
  toUserId: string;
  status: TransferStatus;
  objectionDeadlineAt: Date;
  createdAt: Date;
  resolvedAt: Date | null;
}

export class AccountTransferMapper {
  static toDomain(row: AccountTransferRow): AccountTransfer {
    return AccountTransfer.fromPersistence({
      id: row.id,
      socialAccountId: row.socialAccountId,
      fromTenureId: row.fromTenureId,
      toUserId: row.toUserId,
      status: row.status,
      objectionDeadlineAt: row.objectionDeadlineAt,
      createdAt: row.createdAt,
      resolvedAt: row.resolvedAt,
    });
  }

  static toPersistence(accountTransfer: AccountTransfer): AccountTransferRow {
    return {
      id: accountTransfer.id,
      socialAccountId: accountTransfer.socialAccountId,
      fromTenureId: accountTransfer.fromTenureId,
      toUserId: accountTransfer.toUserId,
      status: accountTransfer.status,
      objectionDeadlineAt: accountTransfer.objectionDeadlineAt,
      createdAt: accountTransfer.createdAt,
      resolvedAt: accountTransfer.resolvedAt,
    };
  }
}
