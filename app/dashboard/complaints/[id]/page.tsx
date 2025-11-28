import { cookies } from 'next/headers'
import { getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/db'
import ComplaintActions from './actions'
import CommentsSection from './comments'
import Link from 'next/link'

export default async function ComplaintDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    const user = token ? await getUserFromToken(token) : null
    const { id } = await params

    if (!user) {
        return <div>Unauthorized</div>
    }

    const complaint = await prisma.complaint.findUnique({
        where: { id },
        include: {
            complainant: true,
            attachments: true,
            assignedOfficer: true,
            assignedDept: true,
            comments: {
                include: {
                    author: {
                        select: { name: true, role: true }
                    }
                },
                orderBy: { createdAt: 'asc' }
            }
        }
    })

    if (!complaint) {
        return <div>Complaint not found</div>
    }

    // Access control
    const isComplainant = complaint.complainantId === user.id
    const isAssignedOfficer = complaint.assignedOfficerId === user.id
    const isAdmin = user.role === 'ADMIN'
    const isDeptOfficer = user.role === 'DEPT_OFFICER' && complaint.assignedDeptId === user.departmentId

    if (!isComplainant && !isAssignedOfficer && !isAdmin && !isDeptOfficer) {
        return <div>Unauthorized</div>
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1rem' }}>
                <Link href="/dashboard" style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ← Back to Dashboard
                </Link>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{complaint.title}</h1>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                            <span>{new Date(complaint.createdAt).toLocaleString()}</span>
                            <span>•</span>
                            <span>{complaint.category}</span>
                        </div>
                    </div>
                    <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        backgroundColor: getStatusColor(complaint.status),
                        color: 'white'
                    }}>
                        {complaint.status.replace('_', ' ')}
                    </span>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Description</h3>
                    <p style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{complaint.description}</p>
                </div>

                {complaint.attachments.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>Attachments</h3>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {complaint.attachments.map(file => (
                                <a
                                    key={file.id}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        padding: '0.5rem 1rem',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius)',
                                        fontSize: '0.875rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    📄 {file.name}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{
                    padding: '1rem',
                    backgroundColor: 'var(--secondary)',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.875rem',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem'
                }}>
                    <div>
                        <div style={{ color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Submitted By</div>
                        <div style={{ fontWeight: '500' }}>{complaint.complainant.name}</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Assigned Department</div>
                        <div style={{ fontWeight: '500' }}>{complaint.assignedDept?.name || 'Pending Assignment'}</div>
                    </div>
                    {complaint.assignedOfficer && (
                        <div>
                            <div style={{ color: 'var(--muted-foreground)', marginBottom: '0.25rem' }}>Assigned Officer</div>
                            <div style={{ fontWeight: '500' }}>{complaint.assignedOfficer.name}</div>
                        </div>
                    )}
                </div>

                {complaint.resolutionSummary && (
                    <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: 'var(--radius)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#16a34a' }}>Resolution</h3>
                        <p>{complaint.resolutionSummary}</p>
                    </div>
                )}
            </div>

            <ComplaintActions
                complaintId={complaint.id}
                currentStatus={complaint.status}
                isAssignedOfficer={isAssignedOfficer}
                isAdmin={isAdmin}
            />

            <CommentsSection
                complaintId={complaint.id}
                initialComments={complaint.comments as any}
                currentUserEmail={user.email}
            />
        </div>
    )
}

function getStatusColor(status: string) {
    switch (status) {
        case 'SUBMITTED': return '#3b82f6';
        case 'IN_PROGRESS': return '#eab308';
        case 'ESCALATED': return '#ef4444';
        case 'RESOLVED': return '#22c55e';
        default: return '#64748b';
    }
}
