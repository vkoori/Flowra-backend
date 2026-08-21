import { applyScope } from './apply-scope';

describe('applyScope', () => {
  it('merges the social account scope into the where clause', () => {
    const result = applyScope({ status: 'active' }, { socialAccountId: 'sa-1' }, ['socialAccount']);
    expect(result).toEqual({ status: 'active', socialAccountId: 'sa-1' });
  });

  it('merges the tenure scope into the where clause', () => {
    const result = applyScope({ status: 'open' }, { tenureId: 'tn-1' }, ['tenure']);
    expect(result).toEqual({ status: 'open', tenureId: 'tn-1' });
  });

  it('merges both dimensions when both are requested', () => {
    const result = applyScope({}, { socialAccountId: 'sa-1', tenureId: 'tn-1' }, [
      'socialAccount',
      'tenure',
    ]);
    expect(result).toEqual({ socialAccountId: 'sa-1', tenureId: 'tn-1' });
  });

  it('throws rather than silently produce an unscoped query', () => {
    expect(() => applyScope({}, {}, ['socialAccount'])).toThrow(
      'applyScope: missing required scope value for "socialAccountId".',
    );
  });

  it('does not require tenureId when only socialAccount scoping is requested', () => {
    expect(() => applyScope({}, { socialAccountId: 'sa-1' }, ['socialAccount'])).not.toThrow();
  });
});
