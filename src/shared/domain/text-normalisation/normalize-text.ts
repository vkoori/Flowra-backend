export const NORMALIZER_VERSION = 1;

const LETTER_MAP: Array<[RegExp, string]> = [
  [/ي/g, 'ی'],
  [/ك/g, 'ک'],
  [/[آأإ]/g, 'ا'],
];

const ARABIC_DIACRITICS_RE = /[ً-ْٰ]/g;
const ZWNJ_RE = /‌/g;

const DIGIT_MAP: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
};
const NON_ASCII_DIGIT_RE = /[٠-٩۰-۹]/g;

const EMOJI_RE = /(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]|\u{FE0F}|\u{200D})/gu;

export function normalizeText(raw: string): string {
  let text = raw;
  for (const [pattern, replacement] of LETTER_MAP) {
    text = text.replace(pattern, replacement);
  }
  text = text.replace(ARABIC_DIACRITICS_RE, '');
  text = text.replace(ZWNJ_RE, '');
  text = text.replace(NON_ASCII_DIGIT_RE, (digit) => DIGIT_MAP[digit] ?? digit);
  text = text.replace(EMOJI_RE, '');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}
