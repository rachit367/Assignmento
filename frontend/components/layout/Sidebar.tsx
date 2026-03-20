'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Sparkles, Gamepad2 } from 'lucide-react'
import { useAssignmentStore } from '@/store/useAssignmentStore'

const navItems = [
  { href: '/assignments', label: 'Assignments', icon: BookOpen },
]

export default function Sidebar() {
  const pathname = usePathname()
  const assignments = useAssignmentStore((s) => s.assignments)

  return (
    <aside
      className="fixed left-0 top-0 h-full w-60 flex flex-col z-30"
      style={{ backgroundColor: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}
    >
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>A</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-text-primary)' }}>Assignmento</span>
        </div>
      </div>

      {/* Create Assignment button */}
      <div style={{ padding: '16px 16px 8px' }}>
        <Link
          href="/assignments/create"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            padding: '10px 16px',
            borderRadius: 50,
            backgroundColor: 'var(--color-text-primary)',
            color: 'var(--color-surface)',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            border: '2px solid var(--color-primary)',
          }}
        >
          <Sparkles size={14} />
          Create Assignment
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 10,
                marginBottom: 2,
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                backgroundColor: isActive ? 'var(--color-surface-hover)' : 'transparent',
                textDecoration: 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <Icon size={17} style={{ color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }} />
              <span>{label}</span>
              {label === 'Assignments' && assignments.length > 0 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '1px 7px',
                    lineHeight: '18px',
                  }}
                >
                  {assignments.length}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: '1px solid var(--color-border)', padding: '12px' }}>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', padding: '0 12px 8px', lineHeight: '1.4' }}>
          May take ~50s to load due to cold start
        </p>
        <Link
          href="/game"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 12px',
            borderRadius: 10,
            fontSize: 14,
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
            marginBottom: 4,
          }}
        >
          <Gamepad2 size={17} style={{ color: 'var(--color-text-muted)' }} />
          <span>Play Game</span>
        </Link>
      </div>
    </aside>
  )
}
