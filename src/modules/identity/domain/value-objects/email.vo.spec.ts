import { InvalidEmailError } from '../errors/invalid-email.error';
import { Email } from './email.vo';

describe('Email', () => {
  it('accepts a valid email and exposes its raw value', () => {
    const email = Email.create('user@example.com');

    expect(email.value).toBe('user@example.com');
  });

  it('normalises casing and surrounding whitespace', () => {
    const email = Email.create('  User@Example.com  ');

    expect(email.value).toBe('user@example.com');
  });

  it('throws InvalidEmailError for a malformed email', () => {
    expect(() => Email.create('not-an-email')).toThrow(InvalidEmailError);
  });

  it('throws InvalidEmailError for an empty string', () => {
    expect(() => Email.create('')).toThrow(InvalidEmailError);
  });

  it('considers two emails with the same value equal', () => {
    const a = Email.create('user@example.com');
    const b = Email.create('USER@example.com');

    expect(a.equals(b)).toBe(true);
  });
});
