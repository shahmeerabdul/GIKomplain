import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserFromToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import { z } from 'zod'

const complaintSchema = z.object({
    title: z.string().min(5),
    description: z.string().min(10),
    category: z.string(),
    attachments: z.array(z.object({
        url: z.string(),
        name: z.string(),
        size: z.number(),
    })).max(3).optional(),
})

// GET: List complaints for current user
export async function GET(request: Request) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const user = token ? await getUserFromToken(token) : null

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const complaints = await prisma.complaint.findMany({
        where: { complainantId: user.id },
        include: { attachments: true },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ complaints })
}

// POST: Create new complaint
export async function POST(request: Request) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const user = token ? await getUserFromToken(token) : null

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        console.log('Received complaint body:', body)
        const { title, description, category, attachments } = complaintSchema.parse(body)

        // Auto-route based on category (Simple logic for now)
        // In a real app, this would query the Category-Department mapping
        let assignedDeptId = null
        const dept = await prisma.department.findFirst({
            where: { name: { contains: category } } // Naive matching
        })
        if (dept) assignedDeptId = dept.id

        const complaint = await prisma.complaint.create({
            data: {
                title,
                description,
                category,
                complainantId: user.id,
                assignedDeptId,
                attachments: {
                    create: attachments,
                },
                auditLogs: {
                    create: {
                        action: 'SUBMITTED',
                        actorId: user.id,
                        details: 'Complaint submitted',
                    }
                }
            },
            include: { attachments: true },
        })

        return NextResponse.json({ complaint })
    } catch (error) {
        console.error('Complaint submission error:', error)
        if (error instanceof z.ZodError) {
            console.log('Validation errors:', error.issues)
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
