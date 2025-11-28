import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken, hashPassword } from '@/lib/auth'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { Role } from '@/lib/enums'

const createUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.nativeEnum(Role),
    departmentId: z.string().optional(),
})

export async function POST(request: Request) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const user = token ? await getUserFromToken(token) : null

    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const data = createUserSchema.parse(body)

        const existingUser = await prisma.user.findUnique({
            where: { email: data.email }
        })

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 })
        }

        const hashedPassword = await hashPassword(data.password)

        const newUser = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: data.role,
                departmentId: data.departmentId || null,
            }
        })

        const { password, ...userWithoutPassword } = newUser
        return NextResponse.json({ user: userWithoutPassword })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
