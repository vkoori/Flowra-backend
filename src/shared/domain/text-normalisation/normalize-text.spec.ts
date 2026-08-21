import { normalizeText } from './normalize-text';

describe('normalizeText', () => {
  it('unifies Arabic yeh/kaf to their Persian forms', () => {
    expect(normalizeText('يوسف')).toBe('یوسف');
    expect(normalizeText('كتاب')).toBe('کتاب');
  });

  it('unifies alef variants', () => {
    expect(normalizeText('أحمد')).toBe('احمد');
  });

  it('converts Persian (extended Arabic-Indic) digits to ASCII', () => {
    expect(normalizeText('قیمت ۲۵۶')).toBe('قیمت 256');
  });

  it('converts Arabic-Indic digits to ASCII', () => {
    expect(normalizeText('السعر ٢٥٦')).toBe('السعر 256');
  });

  it('removes ZWNJ', () => {
    expect(normalizeText('می‌روم')).toBe('میروم');
  });

  it('strips Arabic diacritics', () => {
    expect(normalizeText('مَرْحَبًا')).toBe('مرحبا');
  });

  it('strips emoji', () => {
    expect(normalizeText('hello 😀 world')).toBe('hello world');
  });

  it('collapses whitespace and trims', () => {
    expect(normalizeText('  a   b\tc\nd  ')).toBe('a b c d');
  });

  it('lets a manager typing Arabic match a user typing Persian', () => {
    expect(normalizeText('قيمت')).toBe(normalizeText('قیمت'));
  });
});
