import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { AccountTenure } from '../../domain/entities/account-tenure.entity';
import { AccountTenureRepository } from '../../domain/repositories/account-tenure.repository';
import { AccountTenureMapper } from '../mappers/account-tenure.mapper';

@Injectable()
export class PrismaAccountTenureRepository implements AccountTenureRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AccountTenure | null> {
    const row = await this.prisma.accountTenure.findUnique({ where: { id } });
    return row ? AccountTenureMapper.toDomain(row) : null;
  }

  async findActiveBySocialAccountId(socialAccountId: string): Promise<AccountTenure | null> {
    const row = await this.prisma.accountTenure.findFirst({
      where: { socialAccountId, endedAt: null },
    });
    return row ? AccountTenureMapper.toDomain(row) : null;
  }

  async save(accountTenure: AccountTenure): Promise<void> {
    const data = AccountTenureMapper.toPersistence(accountTenure);
    await this.prisma.accountTenure.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }
}
