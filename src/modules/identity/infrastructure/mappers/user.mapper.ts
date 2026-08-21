import { Prisma, User as PrismaUser } from '../../../../../generated/prisma';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';

export class UserMapper {
  static toDomain(row: PrismaUser): User {
    return User.fromPersistence({
      id: row.id,
      email: Email.create(row.email),
      passwordHash: row.passwordHash,
      displayName: row.displayName,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(user: User): Prisma.UserCreateInput {
    return {
      id: user.id,
      email: user.email.value,
      passwordHash: user.passwordHash,
      displayName: user.displayName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
