import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { z } from 'zod'

const commentSchema = z.object({
    content: z.string().min(1),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const user = token ? await getUserFromToken(token) : null
    const { id } = await params

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { content } = commentSchema.parse(body)

        // Verify complaint exists and user has access
        const complaint = await prisma.complaint.findUnique({
            where: { id },
            include: { complainant: true }
        })

        if (!complaint) {
            return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
        }

        // Access control: Complainant, Assigned Officer, or Admin
        const isComplainant = complaint.complainantId === user.id
        const isAssignedOfficer = complaint.assignedOfficerId === user.id
        const isAdmin = user.role === 'ADMIN'
        const isDeptOfficer = user.role === 'DEPT_OFFICER' && complaint.assignedDeptId === user.departmentId

        if (!isComplainant && !isAssignedOfficer && !isAdmin && !isDeptOfficer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                complaintId: id,
                authorId: user.id,
            },
            include: {
                author: {
                    select: { name: true, role: true }
                }
            }
        })

        return NextResponse.json({ comment })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
