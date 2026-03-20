'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { AssignmentListItem, AssignmentStatus } from '@/types/assignment'
import ThreeDotMenu from '@/components/ui/ThreeDotMenu'

interface AssignmentCardProps {
  assignment: AssignmentListItem
  onDelete: (id: string) => void
}

const STATUS_CONFIG: Record<AssignmentStatus, { label: string; color: string; bg: string; pulse: boolean }> = {
  pending:    { label: 'Queued',     color: '#d97706', bg: 'rgba(217,119,6,0.1)',  pulse: false },
  processing: { label: 'Generating', color: '#2563eb', bg: 'rgba(37,99,235,0.1)', pulse: true  },
  complete:   { label: 'Ready',      color: '#16a34a', bg: 'rgba(22,163,74,0.1)', pulse: false },
  error:      { label: 'Error',      color: '#dc2626', bg: 'rgba(220,38,38,0.1)', pulse: false },
}

export default function AssignmentCard({ assignment, onDelete }: AssignmentCardProps) {
  const router = useRouter()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const handleView = () => router.push(`/assignments/${assignment._id}`)
  const handleDeleteClick = () => setConfirmingDelete(true)
  const handleConfirmDelete = () => { setConfirmingDelete(false); onDelete(assignment._id) }
  const handleCancelDelete = () => setConfirmingDelete(false)

  const assignedDate = format(new Date(assignment.createdAt), 'dd-MM-yyyy')
  const dueDate = format(new Date(assignment.dueDate), 'dd-MM-yyyy')

  const status = STATUS_CONFIG[assignment.status] ?? STATUS_CONFIG.pending

  return (
    <div
      onClick={!confirmingDelete ? handleView : undefined}
      className={`assignment-card${confirmingDelete ? ' confirming-delete' : ''}`}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: `1px solid ${confirmingDelete ? '#fca5a5' : 'var(--color-border)'}`,
        borderRadius: 16,
        padding: '18px 20px',
        cursor: confirmingDelete ? 'default' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Top row: title + status badge + menu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.4, flex: 1 }}>
          {assignment.name}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Status badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              backgroundColor: status.bg,
              borderRadius: 20,
              padding: '3px 9px',
            }}
          >
            <span
              className={status.pulse ? 'pulse-dot' : ''}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: status.color,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 600, color: status.color, letterSpacing: '0.02em' }}>
              {status.label}
            </span>
          </div>

          {/* Three-dot menu */}
          <div onClick={(e) => e.stopPropagation()}>
            <ThreeDotMenu onView={handleView} onDelete={handleDeleteClick} />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: 'var(--color-divider)' }} />

      {/* Inline delete confirmation */}
      {confirmingDelete ? (
        <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <p style={{ fontSize: 12, color: '#b91c1c', fontWeight: 500 }}>Delete this assignment?</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleCancelDelete}
              style={{ fontSize: 12, padding: '4px 12px', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', cursor: 'pointer', color: 'var(--color-text-body)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              style={{ fontSize: 12, padding: '4px 12px', border: 'none', borderRadius: 8, background: '#ef4444', cursor: 'pointer', color: 'white', fontWeight: 600 }}
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        /* Bottom row: dates */
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-body)' }}>Assigned on : </span>
            {assignedDate}
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-body)' }}>Due : </span>
            {dueDate}
          </p>
        </div>
      )}
    </div>
  )
}
