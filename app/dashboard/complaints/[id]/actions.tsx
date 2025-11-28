'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ComplaintActionsProps {
    complaintId: string
    currentStatus: string
    isAssignedOfficer: boolean
    isAdmin: boolean
}

export default function ComplaintActions({ complaintId, currentStatus, isAssignedOfficer, isAdmin }: ComplaintActionsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showResolve, setShowResolve] = useState(false)
    const [showEscalate, setShowEscalate] = useState(false)
    const [showNotes, setShowNotes] = useState(false)

    async function handleStatusChange(status: string, data: any = {}) {
        setLoading(true)
        try {
            const res = await fetch(`/api/complaints/${complaintId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, ...data }),
            })

            if (!res.ok) throw new Error('Failed to update status')

            router.refresh()
            setShowResolve(false)
            setShowEscalate(false)
        } catch (error) {
            alert('Error updating status')
        } finally {
            setLoading(false)
        }
    }

    async function handleSaveNotes(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const internalNotes = formData.get('internalNotes') as string

        try {
            const res = await fetch(`/api/complaints/${complaintId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: currentStatus, internalNotes }),
            })
            if (!res.ok) throw new Error('Failed to save notes')
            router.refresh()
            setShowNotes(false)
        } catch (error) {
            alert('Error saving notes')
        } finally {
            setLoading(false)
        }
    }

    if (!isAssignedOfficer && !isAdmin) return null

    return (
        <div className="card" style={{ marginTop: '1.5rem', borderTop: '4px solid var(--accent)' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '1rem' }}>Officer Actions</h3>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {currentStatus === 'SUBMITTED' && (
                    <button
                        onClick={() => handleStatusChange('IN_PROGRESS')}
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        Claim Complaint
                    </button>
                )}

                {(currentStatus === 'IN_PROGRESS' || currentStatus === 'ESCALATED') && (
                    <>
                        <button
                            onClick={() => setShowResolve(!showResolve)}
                            disabled={loading}
                            className="btn"
                            style={{ backgroundColor: '#22c55e', color: 'white' }}
                        >
                            Resolve
                        </button>
                        <button
                            onClick={() => setShowEscalate(!showEscalate)}
                            disabled={loading}
                            className="btn"
                            style={{ backgroundColor: '#ef4444', color: 'white' }}
                        >
                            Escalate
                        </button>
                    </>
                )}

                <button
                    onClick={() => setShowNotes(!showNotes)}
                    className="btn btn-outline"
                >
                    {showNotes ? 'Hide Notes' : 'Internal Notes'}
                </button>
            </div>

            {showResolve && (
                <form onSubmit={(e) => {
                    e.preventDefault()
                    const summary = (e.currentTarget.elements.namedItem('resolutionSummary') as HTMLTextAreaElement).value
                    handleStatusChange('RESOLVED', { resolutionSummary: summary })
                }} style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Resolution Summary (Required)</label>
                    <textarea name="resolutionSummary" required className="input" rows={3} placeholder="Describe how the issue was resolved..." />
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" disabled={loading} className="btn btn-primary">Confirm Resolution</button>
                        <button type="button" onClick={() => setShowResolve(false)} className="btn btn-outline">Cancel</button>
                    </div>
                </form>
            )}

            {showEscalate && (
                <form onSubmit={(e) => {
                    e.preventDefault()
                    const reason = (e.currentTarget.elements.namedItem('escalationReason') as HTMLTextAreaElement).value
                    handleStatusChange('ESCALATED', { escalationReason: reason })
                }} style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Escalation Reason (Required)</label>
                    <textarea name="escalationReason" required className="input" rows={3} placeholder="Why is this being escalated?" />
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" disabled={loading} className="btn" style={{ backgroundColor: '#ef4444', color: 'white' }}>Confirm Escalation</button>
                        <button type="button" onClick={() => setShowEscalate(false)} className="btn btn-outline">Cancel</button>
                    </div>
                </form>
            )}

            {showNotes && (
                <form onSubmit={handleSaveNotes} style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Internal Notes (Visible only to Officers/Admin)</label>
                    <textarea name="internalNotes" className="input" rows={3} placeholder="Add internal notes..." />
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" disabled={loading} className="btn btn-primary">Save Notes</button>
                    </div>
                </form>
            )}
        </div>
    )
}
