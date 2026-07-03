import { createHmac, timingSafeEqual } from 'crypto';

export const COLLECTION_ACCESS_COOKIE_PREFIX = 'collection_access_';
export const COLLECTION_ACCESS_MAX_AGE = 60 * 60 * 24 * 365;

function getSecret() {
  return (
    process.env.COLLECTION_AUTH_SECRET ||
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
    'dev-collection-auth-secret'
  );
}

export function getCollectionAccessCookieName(slug: string) {
  return `${COLLECTION_ACCESS_COOKIE_PREFIX}${slug}`;
}

export function createCollectionAccessToken(
  slug: string,
  collectionId: string,
  password: string
) {
  return createHmac('sha256', getSecret())
    .update(`${slug}:${collectionId}:${password}`)
    .digest('hex');
}

export function verifyCollectionAccessToken(
  slug: string,
  collectionId: string,
  password: string,
  token: string
) {
  const expected = createCollectionAccessToken(slug, collectionId, password);
  if (expected.length !== token.length) return false;

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

export function getCollectionAccessCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: COLLECTION_ACCESS_MAX_AGE,
    path: '/',
  };
}
