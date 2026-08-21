import { User as PrismaUser } from '../../../../../generated/prisma';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Email } from '../../domain/value-objects/email.vo';
import { User } from '../../domain/entities/user.entity';
import { PrismaUserRepository } from './prisma-user.repository';

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

function makeUser(): User {
  return User.create(
    { email: Email.create('new-user@example.com'), passwordHash: 'hash', displayName: 'Grace' },
    new Date('2026-08-21T00:00:00.000Z'),
  );
}

describe('PrismaUserRepository', () => {
  describe('findById', () => {
    it('calls findUnique with an id where clause and maps the row', async () => {
      const row = makeRow();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { user: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaUserRepository(prisma);

      const user = await repository.findById('user-1');

      expect(findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(user?.id).toBe(row.id);
      expect(user?.email.value).toBe(row.email);
    });

    it('returns null when Prisma returns null', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { user: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaUserRepository(prisma);

      const user = await repository.findById('missing-id');

      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('calls findUnique with an email where clause and maps the row', async () => {
      const row = makeRow();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { user: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaUserRepository(prisma);

      const user = await repository.findByEmail('user@example.com');

      expect(findUnique).toHaveBeenCalledWith({ where: { email: 'user@example.com' } });
      expect(user?.email.value).toBe(row.email);
    });

    it('returns null when Prisma returns null', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { user: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaUserRepository(prisma);

      const user = await repository.findByEmail('missing@example.com');

      expect(user).toBeNull();
    });
  });

  describe('save', () => {
    it('upserts using the user id, with matching create/update payloads', async () => {
      const upsert = jest.fn().mockResolvedValue(undefined);
      const prisma = { user: { upsert } } as unknown as PrismaService;
      const repository = new PrismaUserRepository(prisma);
      const user = makeUser();

      await repository.save(user);

      expect(upsert).toHaveBeenCalledTimes(1);
      const call = upsert.mock.calls[0][0];
      expect(call.where).toEqual({ id: user.id });
      expect(call.create).toEqual(call.update);
      expect(call.create).toEqual({
        id: user.id,
        email: user.email.value,
        passwordHash: user.passwordHash,
        displayName: user.displayName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    });
  });
});
