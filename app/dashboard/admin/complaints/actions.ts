'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function assignComplaint(complaintId: string, type: 'department' | 'officer', id: string) {
    try {
        const updateData: any = {}

        if (type === 'department') {
            updateData.assignedDeptId = id
            // If assigning to a department, we might want to clear the specific officer assignment or keep it?
            // Usually assigning to a dept means it's in their queue. Let's clear officer for now to avoid confusion, or keep it if it's a specific person in that dept.
            // Let's just update the specific field requested.
        } else if (type === 'officer') {
            updateData.assignedOfficerId = id
        }

        await prisma.complaint.update({
            where: { id: complaintId },
            data: updateData
        })

        revalidatePath('/dashboard/admin')
        return { success: true }
    } catch (error) {
        console.error('Failed to assign complaint:', error)
        return { success: false, error: 'Failed to assign complaint' }
    }
}
