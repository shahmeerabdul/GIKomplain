import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
        return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
        where: { verificationToken: token },
    })

    if (!user) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: new Date(),
            verificationToken: null, // Consume the token
        },
    })

    // Redirect to login with success message
    return NextResponse.redirect(new URL('/login?verified=true', request.url))
}
