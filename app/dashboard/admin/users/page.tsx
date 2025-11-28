import { cookies } from 'next/headers'
import { getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import UserManagement from './user-management'

export default async function UserManagementPage() {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const user = token ? await getUserFromToken(token) : null

    if (!user || user.role !== 'ADMIN') {
        return <div>Unauthorized</div>
    }

    const [users, departments] = await Promise.all([
        prisma.user.findMany({
            orderBy: { name: 'asc' },
            include: { department: true }
        }),
        prisma.department.findMany({
            orderBy: { name: 'asc' }
        })
    ])

    return (
        <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '2rem' }}>User Management</h1>
            <UserManagement initialUsers={users} departments={departments} />
        </div>
    )
}
