import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { z } from 'zod'

const updateSchema = z.object({
    status: z.enum(['IN_PROGRESS', 'ESCALATED', 'RESOLVED']),
    resolutionSummary: z.string().optional(),
    internalNotes: z.string().optional(),
    escalationReason: z.string().optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const user = token ? await getUserFromToken(token) : null

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { status, resolutionSummary, internalNotes, escalationReason } = updateSchema.parse(body)
        const { id: complaintId } = await params

        const complaint = await prisma.complaint.findUnique({
            where: { id: complaintId },
        })

        if (!complaint) {
            return NextResponse.json({ error: 'Complaint not found' }, { status: 404 })
        }

        // Authorization checks
        const isOfficer = user.role === 'DEPT_OFFICER' && user.departmentId === complaint.assignedDeptId
        const isAdmin = user.role === 'ADMIN'

        if (!isOfficer && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Logic for transitions
        const updates: any = { status }
        let auditAction = `STATUS_CHANGED_TO_${status}`
        let auditDetails = ''

        if (status === 'IN_PROGRESS') {
            updates.assignedOfficerId = user.id
            auditDetails = 'Complaint claimed by officer'
        } else if (status === 'RESOLVED') {
            if (!resolutionSummary) {
                return NextResponse.json({ error: 'Resolution summary is required' }, { status: 400 })
            }
            updates.resolutionSummary = resolutionSummary
            auditDetails = `Resolved: ${resolutionSummary}`
        } else if (status === 'ESCALATED') {
            if (!escalationReason) {
                return NextResponse.json({ error: 'Escalation reason is required' }, { status: 400 })
            }
            auditDetails = `Escalated: ${escalationReason}`
        }

        if (internalNotes) {
            updates.internalNotes = internalNotes
        }

        const updatedComplaint = await prisma.complaint.update({
            where: { id: complaintId },
            data: {
                ...updates,
                auditLogs: {
                    create: {
                        action: auditAction,
                        actorId: user.id,
                        details: auditDetails,
                    }
                }
            }
        })

        return NextResponse.json({ complaint: updatedComplaint })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as any).errors }, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
