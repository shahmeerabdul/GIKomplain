import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { Role } from '@/lib/enums'

const updateUserSchema = z.object({
    role: z.nativeEnum(Role).optional(),
    departmentId: z.string().nullable().optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const user = token ? await getUserFromToken(token) : null
    const { id } = await params

    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const data = updateUserSchema.parse(body)

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                ...(data.role && { role: data.role }),
                ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
            }
        })

        const { password, ...userWithoutPassword } = updatedUser
        return NextResponse.json({ user: userWithoutPassword })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const user = token ? await getUserFromToken(token) : null
    const { id } = await params

    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.id === id) {
        return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    try {
        await prisma.user.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
}
