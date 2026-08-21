import { ChannelConnection as PrismaChannelConnection } from '../../../../../generated/prisma';
import { ChannelConnection } from '../../domain/entities/channel-connection.entity';
import { ChannelConnectionMapper } from './channel-connection.mapper';

function makeRow(overrides: Partial<PrismaChannelConnection> = {}): PrismaChannelConnection {
  return {
    id: 'connection-1',
    socialAccountId: 'social-account-1',
    platform: 'instagram',
    accessTokenEncrypted: 'ciphertext-access-1',
    refreshTokenEncrypted: 'ciphertext-refresh-1',
    tokenExpiresAt: new Date('2026-06-01T00:00:00.000Z'),
    capabilities: ['reply_to_comment', 'send_direct_message'],
    status: 'active',
    authorizedByUserId: 'user-1',
    deletedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('ChannelConnectionMapper', () => {
  describe('toDomain', () => {
    it('maps every field from a Prisma row to a ChannelConnection entity', () => {
      const row = makeRow();

      const connection = ChannelConnectionMapper.toDomain(row);

      expect(connection).toBeInstanceOf(ChannelConnection);
      expect(connection.id).toBe(row.id);
      expect(connection.socialAccountId).toBe(row.socialAccountId);
      expect(connection.platform).toBe(row.platform);
      expect(connection.accessTokenEncrypted).toBe(row.accessTokenEncrypted);
      expect(connection.refreshTokenEncrypted).toBe(row.refreshTokenEncrypted);
      expect(connection.tokenExpiresAt).toBe(row.tokenExpiresAt);
      expect(connection.capabilities).toEqual(row.capabilities);
      expect(connection.status).toBe(row.status);
      expect(connection.authorizedByUserId).toBe(row.authorizedByUserId);
      expect(connection.deletedAt).toBe(row.deletedAt);
      expect(connection.createdAt).toBe(row.createdAt);
      expect(connection.updatedAt).toBe(row.updatedAt);
    });

    it('maps the nullable fields when they are null', () => {
      const row = makeRow({
        refreshTokenEncrypted: null,
        tokenExpiresAt: null,
        deletedAt: null,
      });

      const connection = ChannelConnectionMapper.toDomain(row);

      expect(connection.refreshTokenEncrypted).toBeNull();
      expect(connection.tokenExpiresAt).toBeNull();
      expect(connection.deletedAt).toBeNull();
    });

    it('maps a deactivated row, preserving deletedAt', () => {
      const deletedAt = new Date('2026-02-01T00:00:00.000Z');
      const row = makeRow({ status: 'revoked', deletedAt });

      const connection = ChannelConnectionMapper.toDomain(row);

      expect(connection.status).toBe('revoked');
      expect(connection.deletedAt).toBe(deletedAt);
    });
  });

  describe('toPersistence', () => {
    it('maps every field from a ChannelConnection entity to a Prisma create input', () => {
      const row = makeRow();
      const connection = ChannelConnectionMapper.toDomain(row);

      const persistence = ChannelConnectionMapper.toPersistence(connection);

      expect(persistence).toEqual({
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
    });

    it('round-trips every field, including nullable ones and the capabilities array', () => {
      const row = makeRow({
        refreshTokenEncrypted: null,
        tokenExpiresAt: null,
        deletedAt: null,
        capabilities: ['reply_to_comment'],
      });
      const connection = ChannelConnectionMapper.toDomain(row);

      const persistence = ChannelConnectionMapper.toPersistence(connection);
      const rehydrated = ChannelConnectionMapper.toDomain({
        ...row,
        ...persistence,
      } as PrismaChannelConnection);

      expect(rehydrated.id).toBe(row.id);
      expect(rehydrated.socialAccountId).toBe(row.socialAccountId);
      expect(rehydrated.platform).toBe(row.platform);
      expect(rehydrated.accessTokenEncrypted).toBe(row.accessTokenEncrypted);
      expect(rehydrated.refreshTokenEncrypted).toBeNull();
      expect(rehydrated.tokenExpiresAt).toBeNull();
      expect(rehydrated.capabilities).toEqual(['reply_to_comment']);
      expect(rehydrated.status).toBe(row.status);
      expect(rehydrated.authorizedByUserId).toBe(row.authorizedByUserId);
      expect(rehydrated.deletedAt).toBeNull();
      expect(rehydrated.createdAt).toBe(row.createdAt);
      expect(rehydrated.updatedAt).toBe(row.updatedAt);
    });

    it('round-trips a ChannelConnection created via ChannelConnection.create()', () => {
      const now = new Date('2026-08-21T00:00:00.000Z');
      const connection = ChannelConnection.create(
        {
          socialAccountId: 'social-account-2',
          platform: 'telegram',
          accessTokenEncrypted: 'ciphertext-access-new',
          refreshTokenEncrypted: 'ciphertext-refresh-new',
          tokenExpiresAt: new Date('2026-09-01T00:00:00.000Z'),
          capabilities: ['send_direct_message'],
          authorizedByUserId: 'user-2',
        },
        now,
      );

      const persistence = ChannelConnectionMapper.toPersistence(connection);
      const rehydrated = ChannelConnectionMapper.toDomain(persistence as PrismaChannelConnection);

      expect(rehydrated.id).toBe(connection.id);
      expect(rehydrated.socialAccountId).toBe('social-account-2');
      expect(rehydrated.platform).toBe('telegram');
      expect(rehydrated.accessTokenEncrypted).toBe('ciphertext-access-new');
      expect(rehydrated.refreshTokenEncrypted).toBe('ciphertext-refresh-new');
      expect(rehydrated.tokenExpiresAt).toEqual(new Date('2026-09-01T00:00:00.000Z'));
      expect(rehydrated.capabilities).toEqual(['send_direct_message']);
      expect(rehydrated.status).toBe('active');
      expect(rehydrated.authorizedByUserId).toBe('user-2');
      expect(rehydrated.deletedAt).toBeNull();
      expect(rehydrated.createdAt).toBe(now);
      expect(rehydrated.updatedAt).toBe(now);
    });
  });
});
