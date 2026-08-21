import { Prisma } from '../../../../generated/prisma';

const UNIQUE_CONSTRAINT_VIOLATION_CODE = 'P2002';

export function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === UNIQUE_CONSTRAINT_VIOLATION_CODE
  );
}
