import { AccountTransfer } from '../entities/account-transfer.entity';

export interface AccountTransferRepository {
  findById(id: string): Promise<AccountTransfer | null>;
  findPendingBySocialAccountId(socialAccountId: string): Promise<AccountTransfer | null>;
  save(accountTransfer: AccountTransfer): Promise<void>;
}

export const ACCOUNT_TRANSFER_REPOSITORY = Symbol('ACCOUNT_TRANSFER_REPOSITORY');
