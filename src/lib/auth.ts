import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './db';

const DEFAULT_SECRET = 'dev-secret-change-me';
const JWT_SECRET = process.env.AUTH_SECRET || DEFAULT_SECRET;
const TOKEN_COOKIE = 'cloudiezzz_token';
const TOKEN_EXPIRY = '7d';

if (JWT_SECRET === DEFAULT_SECRET) {
  console.warn(
    '\n⚠️  WARNING: AUTH_SECRET is using the default value! This is insecure.\n' +
    '⚠️  Set a strong AUTH_SECRET environment variable in production.\n'
  );
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function authenticate(email: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.isActive) return null;

  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function requireRole(user: AuthUser | null, ...roles: string[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters' };
  return { valid: true };
}
