import { Prisma } from '../../../../generated/prisma';
import { isUniqueConstraintViolation } from './prisma-unique-violation';

describe('isUniqueConstraintViolation', () => {
  it('returns true for a Prisma P2002 error', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    });
    expect(isUniqueConstraintViolation(error)).toBe(true);
  });

  it('returns false for a different Prisma error code', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: 'test',
    });
    expect(isUniqueConstraintViolation(error)).toBe(false);
  });

  it('returns false for a non-Prisma error', () => {
    expect(isUniqueConstraintViolation(new Error('plain error'))).toBe(false);
  });

  it('returns false for a non-error value', () => {
    expect(isUniqueConstraintViolation('not an error')).toBe(false);
    expect(isUniqueConstraintViolation(undefined)).toBe(false);
  });
});
