import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { RetentionPolicy } from '../../domain/entities/retention-policy.entity';
import { RetentionPolicyRepository } from '../../domain/repositories/retention-policy.repository';
import { RetentionPolicyMapper } from '../mappers/retention-policy.mapper';

@Injectable()
export class PrismaRetentionPolicyRepository implements RetentionPolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<RetentionPolicy | null> {
    const row = await this.prisma.retentionPolicy.findUnique({ where: { id } });
    return row ? RetentionPolicyMapper.toDomain(row) : null;
  }

  async findBySocialAccountId(socialAccountId: string): Promise<RetentionPolicy[]> {
    const rows = await this.prisma.retentionPolicy.findMany({ where: { socialAccountId } });
    return rows.map((row) => RetentionPolicyMapper.toDomain(row));
  }

  async save(retentionPolicy: RetentionPolicy): Promise<void> {
    const data = RetentionPolicyMapper.toPersistence(retentionPolicy);
    await this.prisma.retentionPolicy.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }
}
