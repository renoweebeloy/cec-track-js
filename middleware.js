import { NextResponse } from 'next/server';

// 1. I-SET NGA 'true' ARON MA-UNDER MAINTENANCE ANG SITE
const IS_MAINTENANCE_MODE = true;

// 2. KINI IMONG SECRET CODE NGA IKAW RAY NASAYOD ARON MAKASULOD KA
const BYPASS_SECRET_CODE = 'renowee2026';

export function middleware(req) {
  const { pathname, searchParams } = req.nextUrl;

  // Pasagdi ang mga static assets, css, api, ug images aron dili maguba
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // A. KUNG NIKLIK KA SA IMONG BYPASS LINK: ?bypass=renowee2026
  if (searchParams.get('bypass') === BYPASS_SECRET_CODE) {
    const response = NextResponse.redirect(new URL('/', req.url));
    // Tagaan ang imong browser og secret cookie sulod sa 24 oras
    response.cookies.set('cec_admin_bypass', 'granted', {
      path: '/',
      maxAge: 60 * 60 * 24, // 1 ka adlaw
      httpOnly: true,
    });
    return response;
  }

  // B. KUNG OFF ANG MAINTENANCE MODE (GIBUKSAN NA SA TANAN)
  if (!IS_MAINTENANCE_MODE) {
    return NextResponse.next();
  }

  // C. SUSIHA KUNG NAKA-BYPASS NA BA KA ISIP ADMIN
  const hasBypass = req.cookies.get('cec_admin_bypass')?.value === 'granted';
  if (hasBypass) {
    return NextResponse.next(); // Makasulod ka sa login, admin, dashboard nga normal
  }

  // D. KUNG NAA NA SA MAINTENANCE PAGE, AYAW NA I-REDIRECT BALIK
  if (pathname === '/maintenance') {
    return NextResponse.next();
  }

  // E. ANG UBANG ORDINARYONG BISITA UG ESTUDYANTE: IDIREKTA SA MAINTENANCE PAGE
  return NextResponse.redirect(new URL('/maintenance', req.url));
}

export const config = {
  matcher: '/:path*',
};
