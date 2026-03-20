'use client'

import { useState, useEffect } from 'react'
import { LayoutGrid, Sun, Moon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useAssignmentStore } from '@/store/useAssignmentStore'

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const currentAssignment = useAssignmentStore((s) => s.currentAssignment)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark') {
      document.documentElement.classList.add('dark')
      setIsDark(true)
    }
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const getPageLabel = () => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 0) return 'Home'

    if (segments[0] === 'assignments' && segments.length === 2 && segments[1] !== 'create') {
      if (currentAssignment && currentAssignment._id === segments[1]) {
        return currentAssignment.name || 'Assignment'
      }
      return 'Assignment'
    }

    const last = segments[segments.length - 1]
    if (last === 'create') return 'Create Assignment'
    if (last === 'assignments') return 'Assignments'
    return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ')
  }

  const pageLabel = getPageLabel()
  const canGoBack = pathname !== '/' && pathname !== '/assignments'

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: '240px',
        height: '60px',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Left — back + page label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {canGoBack && (
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              padding: 4,
              borderRadius: 6,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LayoutGrid size={16} style={{ color: 'var(--color-text-muted)' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{pageLabel}</span>
        </div>
      </div>

      {/* Right — theme toggle */}
      <button
        onClick={toggleTheme}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          padding: 6,
          borderRadius: 8,
        }}
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </header>
  )
}
