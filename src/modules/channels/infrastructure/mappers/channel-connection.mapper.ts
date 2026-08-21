import {
  ChannelConnection as PrismaChannelConnection,
  Prisma,
} from '../../../../../generated/prisma';
import { ChannelConnection } from '../../domain/entities/channel-connection.entity';

export class ChannelConnectionMapper {
  static toDomain(row: PrismaChannelConnection): ChannelConnection {
    return ChannelConnection.fromPersistence({
      id: row.id,
      socialAccountId: row.socialAccountId,
      platform: row.platform,
      accessTokenEncrypted: row.accessTokenEncrypted,
      refreshTokenEncrypted: row.refreshTokenEncrypted,
      tokenExpiresAt: row.tokenExpiresAt,
      capabilities: row.capabilities,
      status: row.status,
      authorizedByUserId: row.authorizedByUserId,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(connection: ChannelConnection): Prisma.ChannelConnectionCreateInput {
    return {
      id: connection.id,
      socialAccountId: connection.socialAccountId,
      platform: connection.platform,
      accessTokenEncrypted: connection.accessTokenEncrypted,
      refreshTokenEncrypted: connection.refreshTokenEncrypted,
      tokenExpiresAt: connection.tokenExpiresAt,
      capabilities: connection.capabilities,
      status: connection.status,
      authorizedByUserId: connection.authorizedByUserId,
      deletedAt: connection.deletedAt,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };
  }
}
