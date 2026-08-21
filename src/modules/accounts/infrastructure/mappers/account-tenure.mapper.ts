import { AccountTenure, TenureEndReason } from '../../domain/entities/account-tenure.entity';

export interface AccountTenureRow {
  id: string;
  socialAccountId: string;
  userId: string;
  startedAt: Date;
  endedAt: Date | null;
  endReason: TenureEndReason | null;
  createdAt: Date;
}

export class AccountTenureMapper {
  static toDomain(row: AccountTenureRow): AccountTenure {
    return AccountTenure.fromPersistence({
      id: row.id,
      socialAccountId: row.socialAccountId,
      userId: row.userId,
      startedAt: row.startedAt,
      endedAt: row.endedAt,
      endReason: row.endReason,
      createdAt: row.createdAt,
    });
  }

  static toPersistence(accountTenure: AccountTenure): AccountTenureRow {
    return {
      id: accountTenure.id,
      socialAccountId: accountTenure.socialAccountId,
      userId: accountTenure.userId,
      startedAt: accountTenure.startedAt,
      endedAt: accountTenure.endedAt,
      endReason: accountTenure.endReason,
      createdAt: accountTenure.createdAt,
    };
  }
}
