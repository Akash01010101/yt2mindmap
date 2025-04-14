import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
export async function middleware(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    // Check if we're on the mindmap page and not authenticated
    if (request.nextUrl.pathname.startsWith('/mindmap') && !token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
export const config = {
  matcher: ['/mindmap/:path*']
}