import { NextResponse, type NextRequest } from 'next/server';

// Simple in-memory rate limiter
const rateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count++;
  return entry.count > limit;
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  rateMap.forEach((val, key) => {
    if (now > val.resetAt) rateMap.delete(key);
  });
}, 300000);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only rate-limit POST API endpoints
  if (request.method === 'POST' && pathname.startsWith('/api/')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    // Stricter limit for auth (5/min), normal for others (20/min)
    const isAuth = pathname.includes('/auth/');
    const limit = isAuth ? 5 : 20;

    if (isRateLimited(ip, limit, 60000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
