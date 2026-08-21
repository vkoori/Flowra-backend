import { AccountTenure } from '../entities/account-tenure.entity';

export interface AccountTenureRepository {
  findById(id: string): Promise<AccountTenure | null>;
  findActiveBySocialAccountId(socialAccountId: string): Promise<AccountTenure | null>;
  save(accountTenure: AccountTenure): Promise<void>;
}

export const ACCOUNT_TENURE_REPOSITORY = Symbol('ACCOUNT_TENURE_REPOSITORY');
