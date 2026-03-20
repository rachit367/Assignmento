'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Sparkles, X, Plus, Gamepad2 } from 'lucide-react'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileHeader from './MobileHeader'
import BottomNav from './BottomNav'
import GenerationCompleteToast from '@/components/ui/GenerationCompleteToast'
import { useBackgroundSocket } from '@/hooks/useBackgroundSocket'
import { useAssignmentStore } from '@/store/useAssignmentStore'

const navItems = [
  { href: '/assignments', label: 'Assignments', icon: BookOpen },
]

function BackgroundTracker() {
  useBackgroundSocket()
  return null
}

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()
  const assignments = useAssignmentStore((s) => s.assignments)
  const currentAssignment = useAssignmentStore((s) => s.currentAssignment)
  const isLoading = useAssignmentStore((s) => s.isLoading)

  const isAssignmentsPage = pathname === '/assignments'
  const hideMobileFab = isAssignmentsPage && assignments.length === 0 && !isLoading

  const getMobileTitle = () => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 0) return 'Assignmento'
    if (segments[0] === 'assignments' && segments.length === 2 && segments[1] !== 'create') {
      return currentAssignment?.name || 'Assignment'
    }
    const last = segments[segments.length - 1]
    if (last === 'create') return 'Create'
    if (last === 'assignments') return 'Assignments'
    return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ')
  }

  return (
    <>
      {/* ── Desktop layout ── */}
      <div className="desktop-only flex min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
        <Sidebar />
        <div style={{ flex: 1, marginLeft: '240px' }}>
          <Header />
          <main style={{ paddingTop: '60px', minHeight: '100vh' }}>
            {children}
          </main>
        </div>
      </div>

      {/* ── Mobile layout ── */}
      <div className="mobile-only" style={{ flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--background)' }}>
        <MobileHeader
          onMenuOpen={() => setDrawerOpen(true)}
          title={getMobileTitle()}
        />

        <main style={{ paddingTop: 76, paddingBottom: 80, minHeight: '100vh' }}>
          {children}
        </main>

        <BottomNav />

        {/* FAB — create assignment */}
        {!hideMobileFab && (
          <Link
            href="/assignments/create"
            style={{
              position: 'fixed',
              bottom: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              zIndex: 39,
              border: '1px solid var(--color-border)',
            }}
          >
            <Plus size={26} strokeWidth={2.5} />
          </Link>
        )}

        {/* Drawer overlay */}
        {drawerOpen && (
          <div className="mobile-drawer-overlay" onClick={() => setDrawerOpen(false)} />
        )}

        {/* Slide-in drawer */}
        <div className={`mobile-drawer ${drawerOpen ? 'open' : ''}`}>
          {/* Drawer header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 16px',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
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
            <button
              onClick={() => setDrawerOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>

          {/* Create button */}
          <div style={{ padding: '12px 16px' }}>
            <Link
              href="/assignments/create"
              onClick={() => setDrawerOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '10px 0',
                borderRadius: 50,
                backgroundColor: 'var(--color-text-primary)',
                color: 'var(--color-surface)',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <Sparkles size={14} />
              Create Assignment
            </Link>
          </div>

          {/* Nav items */}
          <nav style={{ padding: '4px 12px' }}>
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 10,
                    marginBottom: 2,
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    backgroundColor: isActive ? 'var(--color-surface-hover)' : 'transparent',
                    textDecoration: 'none',
                  }}
                >
                  <Icon size={17} style={{ color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTop: '1px solid var(--color-border)', padding: '12px' }}>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)', padding: '0 12px 8px', lineHeight: '1.4' }}>
              May take ~50s to load due to cold start
            </p>
            <Link
              href="/game"
              onClick={() => setDrawerOpen(false)}
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
        </div>
      </div>

      <BackgroundTracker />
      <GenerationCompleteToast />
    </>
  )
}
