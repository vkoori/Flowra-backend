import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { ChannelConnection } from '../../domain/entities/channel-connection.entity';
import { ChannelConnectionRepository } from '../../domain/repositories/channel-connection.repository';
import { ChannelConnectionMapper } from '../mappers/channel-connection.mapper';

@Injectable()
export class PrismaChannelConnectionRepository implements ChannelConnectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ChannelConnection | null> {
    const row = await this.prisma.channelConnection.findUnique({ where: { id } });
    return row ? ChannelConnectionMapper.toDomain(row) : null;
  }

  async findActiveBySocialAccountId(socialAccountId: string): Promise<ChannelConnection[]> {
    const rows = await this.prisma.channelConnection.findMany({
      where: { socialAccountId, deletedAt: null },
    });
    return rows.map((row) => ChannelConnectionMapper.toDomain(row));
  }

  async save(connection: ChannelConnection): Promise<void> {
    const data = ChannelConnectionMapper.toPersistence(connection);
    await this.prisma.channelConnection.upsert({
      where: { id: connection.id },
      create: data,
      update: data,
    });
  }
}
