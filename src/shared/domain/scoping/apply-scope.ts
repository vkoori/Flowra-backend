import { ScopeContext, ScopeDimension } from './scope-context';

const FIELD_BY_DIMENSION: Record<ScopeDimension, keyof ScopeContext> = {
  socialAccount: 'socialAccountId',
  tenure: 'tenureId',
};

export function applyScope<T extends Record<string, unknown>>(
  where: T,
  scope: ScopeContext,
  dimensions: ScopeDimension[],
): T {
  const scopedFields: Record<string, string> = {};
  for (const dimension of dimensions) {
    const field = FIELD_BY_DIMENSION[dimension];
    const value = scope[field];
    if (!value) {
      throw new Error(`applyScope: missing required scope value for "${field}".`);
    }
    scopedFields[field] = value;
  }
  return { ...where, ...scopedFields };
}
