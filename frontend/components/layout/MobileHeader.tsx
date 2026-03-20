'use client'

import { Menu } from 'lucide-react'

interface MobileHeaderProps {
  onMenuOpen?: () => void
  title?: string
}

export default function MobileHeader({ onMenuOpen, title }: MobileHeaderProps) {
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        padding: '10px 16px',
        backgroundColor: 'var(--background)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 16,
          padding: '10px 16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          position: 'relative',
        }}
      >
        {/* Left — logo or spacer */}
        {title ? (
          <div style={{ width: 40 }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: 'white', fontWeight: 800, fontSize: 14 }}>A</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-text-primary)' }}>Assignmento</span>
          </div>
        )}

        {/* Centered title */}
        {title && (
          <span
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              fontWeight: 700,
              fontSize: 16,
              color: 'var(--color-text-primary)',
              pointerEvents: 'none',
            }}
          >
            {title}
          </span>
        )}

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onMenuOpen}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
          >
            <Menu size={22} style={{ color: 'var(--color-text-body)' }} />
          </button>
        </div>
      </div>
    </header>
  )
}
