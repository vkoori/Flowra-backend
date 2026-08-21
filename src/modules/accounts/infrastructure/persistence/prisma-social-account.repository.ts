import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { SocialAccount, SocialAccountPlatform } from '../../domain/entities/social-account.entity';
import { SocialAccountRepository } from '../../domain/repositories/social-account.repository';
import { SocialAccountMapper } from '../mappers/social-account.mapper';

@Injectable()
export class PrismaSocialAccountRepository implements SocialAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<SocialAccount | null> {
    const row = await this.prisma.socialAccount.findUnique({ where: { id } });
    return row ? SocialAccountMapper.toDomain(row) : null;
  }

  async findByPlatformAndExternalId(
    platform: SocialAccountPlatform,
    externalAccountId: string,
  ): Promise<SocialAccount | null> {
    const row = await this.prisma.socialAccount.findUnique({
      where: { platform_externalAccountId: { platform, externalAccountId } },
    });
    return row ? SocialAccountMapper.toDomain(row) : null;
  }

  async save(socialAccount: SocialAccount): Promise<void> {
    const data = SocialAccountMapper.toPersistence(socialAccount);
    await this.prisma.socialAccount.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }
}
