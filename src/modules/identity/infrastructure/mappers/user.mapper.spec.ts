import { User as PrismaUser } from '../../../../../generated/prisma';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { UserMapper } from './user.mapper';

function makeRow(overrides: Partial<PrismaUser> = {}): PrismaUser {
  return {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'hashed-password',
    displayName: 'Ada',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('UserMapper', () => {
  describe('toDomain', () => {
    it('maps a Prisma row to a User entity, wrapping email in the Email VO', () => {
      const row = makeRow();

      const user = UserMapper.toDomain(row);

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(row.id);
      expect(user.email).toBeInstanceOf(Email);
      expect(user.email.value).toBe(row.email);
      expect(user.passwordHash).toBe(row.passwordHash);
      expect(user.displayName).toBe(row.displayName);
      expect(user.createdAt).toBe(row.createdAt);
      expect(user.updatedAt).toBe(row.updatedAt);
    });

    it('normalises the email via the Email VO', () => {
      const row = makeRow({ email: 'User@Example.com' });

      const user = UserMapper.toDomain(row);

      expect(user.email.value).toBe('user@example.com');
    });
  });

  describe('toPersistence', () => {
    it('maps a User entity to a Prisma create input, unwrapping the Email VO to a raw string', () => {
      const row = makeRow();
      const user = UserMapper.toDomain(row);

      const persistence = UserMapper.toPersistence(user);

      expect(persistence).toEqual({
        id: row.id,
        email: row.email,
        passwordHash: row.passwordHash,
        displayName: row.displayName,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    });

    it('round-trips a User created via User.create()', () => {
      const now = new Date('2026-08-21T00:00:00.000Z');
      const user = User.create(
        { email: Email.create('new-user@example.com'), passwordHash: 'hash', displayName: 'Grace' },
        now,
      );

      const persistence = UserMapper.toPersistence(user);
      const rehydrated = UserMapper.toDomain({ ...persistence } as PrismaUser);

      expect(rehydrated.id).toBe(user.id);
      expect(rehydrated.email.value).toBe('new-user@example.com');
      expect(rehydrated.passwordHash).toBe('hash');
      expect(rehydrated.displayName).toBe('Grace');
      expect(rehydrated.createdAt).toBe(now);
      expect(rehydrated.updatedAt).toBe(now);
    });
  });
});
