import { InvalidEmailError } from '../errors/invalid-email.error';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(private readonly _value: string) {}

  static create(value: string): Email {
    const trimmed = value.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      throw new InvalidEmailError(value);
    }
    return new Email(trimmed.toLowerCase());
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
