import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'
import { Role } from '@/lib/enums'

const registerSchema = z.object({
    email: z.string().email().refine(email => email.toLowerCase().endsWith('@giki.edu.pk'), {
        message: 'Only @giki.edu.pk emails are allowed'
    }),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.nativeEnum(Role).optional(),
    departmentId: z.string().optional(),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, password, name, role, departmentId } = registerSchema.parse(body)

        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 })
        }

        const hashedPassword = await hashPassword(password)

        await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || Role.STUDENT,
                departmentId,
                verificationToken: null,
                emailVerified: new Date()
            },
        })

        // Do NOT log the user in. Return success message.
        return NextResponse.json({
            message: 'Account created successfully. You can now log in.'
        })
    } catch (error) {
        console.error('Registration Error:', error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as any).errors }, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
