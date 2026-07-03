const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghjkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SPECIAL = '!@#$%^&*-_=+';
const ALL = UPPER + LOWER + DIGITS + SPECIAL;

function pick(charset: string, random: Uint8Array, index: number): string {
  return charset[random[index]! % charset.length]!;
}

export function generateSecurePassword(length = 20): string {
  const size = Math.max(length, 12);
  const random = new Uint8Array(size);
  crypto.getRandomValues(random);

  const chars = [
    pick(UPPER, random, 0),
    pick(LOWER, random, 1),
    pick(DIGITS, random, 2),
    pick(SPECIAL, random, 3),
    ...Array.from({ length: size - 4 }, (_, i) => pick(ALL, random, i + 4)),
  ];

  for (let i = chars.length - 1; i > 0; i--) {
    const j = random[i]! % (i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }

  return chars.join('');
}
