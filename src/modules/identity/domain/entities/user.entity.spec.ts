import { Email } from '../value-objects/email.vo';
import { User } from './user.entity';

describe('User', () => {
  const now = new Date('2026-08-21T00:00:00.000Z');

  it('creates a user with a generated id and the supplied timestamp as createdAt/updatedAt', () => {
    const email = Email.create('user@example.com');

    const user = User.create({ email, passwordHash: 'hashed-password', displayName: 'Ada' }, now);

    expect(user.id).toBeTruthy();
    expect(user.email.value).toBe('user@example.com');
    expect(user.passwordHash).toBe('hashed-password');
    expect(user.displayName).toBe('Ada');
    expect(user.createdAt).toBe(now);
    expect(user.updatedAt).toBe(now);
  });

  it('generates a fresh id per instance', () => {
    const email = Email.create('user@example.com');

    const first = User.create({ email, passwordHash: 'hash', displayName: 'Ada' }, now);
    const second = User.create({ email, passwordHash: 'hash', displayName: 'Ada' }, now);

    expect(first.id).not.toBe(second.id);
  });

  it('rehydrates from persistence without generating a new id or timestamps', () => {
    const email = Email.create('user@example.com');

    const user = User.fromPersistence({
      id: 'existing-id',
      email,
      passwordHash: 'hash',
      displayName: 'Ada',
      createdAt: now,
      updatedAt: now,
    });

    expect(user.id).toBe('existing-id');
    expect(user.createdAt).toBe(now);
    expect(user.updatedAt).toBe(now);
  });

  it('rename() mutates the display name', () => {
    const email = Email.create('user@example.com');
    const user = User.create({ email, passwordHash: 'hash', displayName: 'Ada' }, now);

    user.rename('Grace');

    expect(user.displayName).toBe('Grace');
  });
});
