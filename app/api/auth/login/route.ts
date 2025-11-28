import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { comparePassword, signToken } from '@/lib/auth'
import { z } from 'zod'

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password } = loginSchema.parse(body)

        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user || !(await comparePassword(password, user.password))) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        const token = signToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            departmentId: user.departmentId,
        })

        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                departmentId: user.departmentId,
            },
        })

        // Set HTTP-only cookie
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 86400, // 1 day
            path: '/',
        })

        return response
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as any).errors }, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
