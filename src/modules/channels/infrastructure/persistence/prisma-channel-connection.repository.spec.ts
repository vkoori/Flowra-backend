import { ChannelConnection as PrismaChannelConnection } from '../../../../../generated/prisma';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { ChannelConnection } from '../../domain/entities/channel-connection.entity';
import { PrismaChannelConnectionRepository } from './prisma-channel-connection.repository';

function makeRow(overrides: Partial<PrismaChannelConnection> = {}): PrismaChannelConnection {
  return {
    id: 'connection-1',
    socialAccountId: 'social-account-1',
    platform: 'instagram',
    accessTokenEncrypted: 'ciphertext-access-1',
    refreshTokenEncrypted: 'ciphertext-refresh-1',
    tokenExpiresAt: new Date('2026-06-01T00:00:00.000Z'),
    capabilities: ['reply_to_comment'],
    status: 'active',
    authorizedByUserId: 'user-1',
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

function makeConnection(): ChannelConnection {
  return ChannelConnection.create(
    {
      socialAccountId: 'social-account-1',
      platform: 'instagram',
      accessTokenEncrypted: 'ciphertext-access-1',
      refreshTokenEncrypted: 'ciphertext-refresh-1',
      capabilities: ['reply_to_comment'],
      authorizedByUserId: 'user-1',
    },
    new Date('2026-01-01T00:00:00.000Z'),
  );
}

describe('PrismaChannelConnectionRepository', () => {
  describe('findById', () => {
    it('calls findUnique with the id and maps the row to a ChannelConnection', async () => {
      const row = makeRow();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { channelConnection: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaChannelConnectionRepository(prisma);

      const result = await repository.findById('connection-1');

      expect(findUnique).toHaveBeenCalledWith({ where: { id: 'connection-1' } });
      expect(result).toBeInstanceOf(ChannelConnection);
      expect(result?.id).toBe(row.id);
      expect(result?.socialAccountId).toBe(row.socialAccountId);
    });

    it('returns null when Prisma returns null', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { channelConnection: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaChannelConnectionRepository(prisma);

      const result = await repository.findById('missing-connection');

      expect(findUnique).toHaveBeenCalledWith({ where: { id: 'missing-connection' } });
      expect(result).toBeNull();
    });
  });

  describe('findActiveBySocialAccountId', () => {
    it('calls findMany filtered by socialAccountId and deletedAt: null, mapping every row', async () => {
      const rows = [makeRow({ id: 'connection-1' }), makeRow({ id: 'connection-2' })];
      const findMany = jest.fn().mockResolvedValue(rows);
      const prisma = { channelConnection: { findMany } } as unknown as PrismaService;
      const repository = new PrismaChannelConnectionRepository(prisma);

      const result = await repository.findActiveBySocialAccountId('social-account-1');

      expect(findMany).toHaveBeenCalledWith({
        where: { socialAccountId: 'social-account-1', deletedAt: null },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(ChannelConnection);
      expect(result.map((connection) => connection.id)).toEqual(['connection-1', 'connection-2']);
    });

    it('returns an empty array when no rows match', async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      const prisma = { channelConnection: { findMany } } as unknown as PrismaService;
      const repository = new PrismaChannelConnectionRepository(prisma);

      const result = await repository.findActiveBySocialAccountId('social-account-1');

      expect(result).toEqual([]);
    });
  });

  describe('save', () => {
    it('calls upsert with matching where/create/update using the mapped persistence shape', async () => {
      const upsert = jest.fn().mockResolvedValue(undefined);
      const prisma = { channelConnection: { upsert } } as unknown as PrismaService;
      const repository = new PrismaChannelConnectionRepository(prisma);
      const connection = makeConnection();

      await repository.save(connection);

      expect(upsert).toHaveBeenCalledTimes(1);
      const call = upsert.mock.calls[0][0];
      expect(call.where).toEqual({ id: connection.id });
      expect(call.create).toEqual(call.update);
      expect(call.create).toMatchObject({
        id: connection.id,
        socialAccountId: connection.socialAccountId,
        platform: connection.platform,
        accessTokenEncrypted: connection.accessTokenEncrypted,
        refreshTokenEncrypted: connection.refreshTokenEncrypted,
        capabilities: connection.capabilities,
        status: connection.status,
        authorizedByUserId: connection.authorizedByUserId,
      });
    });
  });
});
