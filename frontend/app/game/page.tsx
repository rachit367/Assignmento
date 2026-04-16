'use client'

import AppShell from '@/components/layout/AppShell'
import DinoGame from '@/components/ui/DinoGame'

export default function GamePage() {
  return (
    <AppShell>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '28px 24px',
        minHeight: 'calc(100vh - 60px)',
      }}>
        <div style={{ width: '100%', maxWidth: 600 }}>
          <DinoGame />
        </div>
      </div>
    </AppShell>
  )
}
