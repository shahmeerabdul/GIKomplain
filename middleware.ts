import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenEdge } from './lib/jwt'

const protectedRoutes = ['/dashboard', '/api/complaints']
const adminRoutes = ['/admin']
const officerRoutes = ['/officer']

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value
    const { pathname } = request.nextUrl

    // Check if route requires auth
    const isProtected = protectedRoutes.some(route => pathname.startsWith(route)) ||
        adminRoutes.some(route => pathname.startsWith(route)) ||
        officerRoutes.some(route => pathname.startsWith(route))

    if (isProtected) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        const payload = await verifyTokenEdge(token)
        if (!payload) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Role-based access control
        if (adminRoutes.some(route => pathname.startsWith(route)) && payload.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        if (officerRoutes.some(route => pathname.startsWith(route)) && payload.role !== 'DEPT_OFFICER' && payload.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
