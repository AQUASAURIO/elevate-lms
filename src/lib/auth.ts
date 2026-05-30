/**
 * Elévate Authentication Utilities
 *
 * - JWT sign/verify using HMAC-SHA256 via Web Crypto API
 * - Password hashing using bcryptjs (cross-runtime: Bun + Node.js + Vercel)
 * - Request helpers to extract user from Authorization header
 */

import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production-32chars!';
const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
  type?: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  sub: string;
}

// ---------------------------------------------------------------------------
// JWT helpers (HMAC-SHA256)
// ---------------------------------------------------------------------------

function base64url(data: Uint8Array): string {
  let binary = '';
  data.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function splitToken(token: string): [string, string, string] {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  return parts as [string, string, string];
}

function decodeSegment(segment: string): Uint8Array {
  const cleaned = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = cleaned + '='.repeat((4 - (cleaned.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Creates a signed JWT.
 */
export async function signToken(payload: AccessTokenPayload | RefreshTokenPayload, expiresIn: number): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);

  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
  };

  const encoder = new TextEncoder();
  const encodedHeader = base64url(encoder.encode(JSON.stringify(header)));
  const encodedPayload = base64url(encoder.encode(JSON.stringify(fullPayload)));
  const unsigned = `${encodedHeader}.${encodedPayload}`;

  const key = await importKey();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(unsigned));

  return `${unsigned}.${base64url(new Uint8Array(signature))}`;
}

/**
 * Convenience: sign an access token (15 min TTL).
 */
export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return signToken({ ...payload, type: 'access' } as AccessTokenPayload & { type: string }, ACCESS_TOKEN_TTL);
}

/**
 * Convenience: sign a refresh token (7 day TTL).
 */
export async function signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  return signToken({ ...payload, type: 'refresh' } as RefreshTokenPayload & { type: string }, REFRESH_TOKEN_TTL);
}

/**
 * Verifies a JWT and returns its payload, or throws on any failure.
 */
export async function verifyToken(token: string): Promise<JwtPayload> {
  const [encodedHeader, encodedPayload, encodedSignature] = splitToken(token);
  const encoder = new TextEncoder();
  const key = await importKey();
  const valid = await crypto.subtle.verify('HMAC', key, decodeSegment(encodedSignature), encoder.encode(`${encodedHeader}.${encodedPayload}`));

  if (!valid) throw new Error('Invalid token signature');

  const payload: JwtPayload = JSON.parse(new TextDecoder().decode(decodeSegment(encodedPayload)));

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
}

// ---------------------------------------------------------------------------
// Password helpers (bcryptjs — cross-runtime)
// ---------------------------------------------------------------------------

const BCRYPT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the Bearer token from an Authorization header.
 */
export function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

/**
 * Verifies the access token from the request and returns its payload.
 * Throws an Error if the token is missing or invalid.
 */
export async function getAuthPayload(request: Request): Promise<JwtPayload> {
  const token = extractBearerToken(request);
  if (!token) throw new Error('Missing authorization token');
  return verifyToken(token);
}

// ---------------------------------------------------------------------------
// Full user fetch helper
// ---------------------------------------------------------------------------

import { db } from '@/lib/db';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  role: string;
  bio: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Verifies the access token from the request, fetches the full user from DB,
 * and returns both the user record and the JWT payload.
 * Throws an Error if the token is missing, invalid, or the user doesn't exist / is disabled.
 */
export async function getAuthUser(request: Request): Promise<{ user: AuthUser; payload: JwtPayload }> {
  const payload = await getAuthPayload(request);
  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
      role: true,
      bio: true,
      emailVerified: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) throw new Error('User not found');
  if (!user.isActive) throw new Error('Account is disabled');
  return { user: user as AuthUser, payload };
}

// ---------------------------------------------------------------------------
// Public constants (for admin endpoints that check roles)
// ---------------------------------------------------------------------------

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const;
