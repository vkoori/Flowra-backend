import { ConnectionAlreadyDeactivatedError } from '../errors/connection-already-deactivated.error';
import { ChannelConnection } from './channel-connection.entity';

describe('ChannelConnection', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');

  function createConnection(): ChannelConnection {
    return ChannelConnection.create(
      {
        socialAccountId: 'social-account-1',
        platform: 'instagram',
        accessTokenEncrypted: 'ciphertext-access-1',
        refreshTokenEncrypted: 'ciphertext-refresh-1',
        capabilities: ['reply_to_comment'],
        authorizedByUserId: 'user-1',
      },
      now,
    );
  }

  it('marks a connection as needing reauthorization', () => {
    const connection = createConnection();
    const at = new Date('2026-01-02T00:00:00.000Z');

    connection.markNeedsReauth(at);

    expect(connection.status).toBe('needs_reauth');
    expect(connection.updatedAt).toBe(at);
  });

  it('reauthorizes in place after needing reauth, clearing the needs_reauth status', () => {
    const connection = createConnection();
    connection.markNeedsReauth(new Date('2026-01-02T00:00:00.000Z'));

    const reauthorizedAt = new Date('2026-01-03T00:00:00.000Z');
    const newExpiry = new Date('2026-06-01T00:00:00.000Z');
    connection.reauthorize(
      {
        accessTokenEncrypted: 'ciphertext-access-2',
        refreshTokenEncrypted: 'ciphertext-refresh-2',
        tokenExpiresAt: newExpiry,
      },
      reauthorizedAt,
    );

    expect(connection.status).toBe('active');
    expect(connection.accessTokenEncrypted).toBe('ciphertext-access-2');
    expect(connection.refreshTokenEncrypted).toBe('ciphertext-refresh-2');
    expect(connection.tokenExpiresAt).toBe(newExpiry);
    expect(connection.updatedAt).toBe(reauthorizedAt);
    expect(connection.id).toBeDefined();
  });

  it('deactivates a connection exactly once', () => {
    const connection = createConnection();
    const deactivatedAt = new Date('2026-01-04T00:00:00.000Z');

    connection.deactivate(deactivatedAt);

    expect(connection.status).toBe('revoked');
    expect(connection.deletedAt).toBe(deactivatedAt);
  });

  it('throws ConnectionAlreadyDeactivatedError on a second deactivate() call', () => {
    const connection = createConnection();
    connection.deactivate(new Date('2026-01-04T00:00:00.000Z'));

    expect(() => connection.deactivate(new Date('2026-01-05T00:00:00.000Z'))).toThrow(
      ConnectionAlreadyDeactivatedError,
    );
  });

  it('throws ConnectionAlreadyDeactivatedError when reauthorizing a deactivated connection', () => {
    const connection = createConnection();
    connection.deactivate(new Date('2026-01-04T00:00:00.000Z'));

    expect(() =>
      connection.reauthorize(
        { accessTokenEncrypted: 'ciphertext-access-3' },
        new Date('2026-01-06T00:00:00.000Z'),
      ),
    ).toThrow(ConnectionAlreadyDeactivatedError);
  });

  it('throws ConnectionAlreadyDeactivatedError when marking a deactivated connection as needing reauth', () => {
    const connection = createConnection();
    connection.deactivate(new Date('2026-01-04T00:00:00.000Z'));

    expect(() => connection.markNeedsReauth(new Date('2026-01-06T00:00:00.000Z'))).toThrow(
      ConnectionAlreadyDeactivatedError,
    );
  });
});
