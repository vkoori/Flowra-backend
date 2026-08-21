import { QuotaCounter } from './quota-counter.entity';

describe('QuotaCounter', () => {
  const now = new Date('2026-08-21T00:00:00.000Z');
  const periodEnd = new Date('2026-09-21T00:00:00.000Z');

  const createCounter = (): QuotaCounter =>
    QuotaCounter.create(
      { socialAccountId: 'social-account-1', metric: 'messages_sent', periodStart: now, periodEnd },
      now,
    );

  it('starts at zero by default', () => {
    const counter = createCounter();

    expect(counter.count).toBe(0);
  });

  it('increment() defaults to bumping by one', () => {
    const counter = createCounter();

    counter.increment();

    expect(counter.count).toBe(1);
  });

  it('increment() accumulates across multiple calls', () => {
    const counter = createCounter();

    counter.increment();
    counter.increment(4);
    counter.increment();

    expect(counter.count).toBe(6);
  });

  it('increment() honors an explicit amount', () => {
    const counter = createCounter();

    counter.increment(10);

    expect(counter.count).toBe(10);
  });
});
