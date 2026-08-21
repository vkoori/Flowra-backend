import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { AccountTransfer } from '../../domain/entities/account-transfer.entity';
import { AccountTransferRepository } from '../../domain/repositories/account-transfer.repository';
import { AccountTransferMapper } from '../mappers/account-transfer.mapper';

@Injectable()
export class PrismaAccountTransferRepository implements AccountTransferRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AccountTransfer | null> {
    const row = await this.prisma.accountTransfer.findUnique({ where: { id } });
    return row ? AccountTransferMapper.toDomain(row) : null;
  }

  async findPendingBySocialAccountId(socialAccountId: string): Promise<AccountTransfer | null> {
    const row = await this.prisma.accountTransfer.findFirst({
      where: { socialAccountId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
    return row ? AccountTransferMapper.toDomain(row) : null;
  }

  async save(accountTransfer: AccountTransfer): Promise<void> {
    const data = AccountTransferMapper.toPersistence(accountTransfer);
    await this.prisma.accountTransfer.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }
}
