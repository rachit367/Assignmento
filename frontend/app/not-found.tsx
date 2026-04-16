'use client'

import Link from 'next/link'
import DinoGame from '@/components/ui/DinoGame'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white select-none">
      <div className="w-full max-w-150 px-4">
        {/* Chrome-style error text */}
        <div className="text-center mb-8">
          <p className="text-[#535353] text-base font-mono">This page isn&apos;t available</p>
          <p className="text-[#969696] text-sm font-mono mt-1">Try checking the URL or go back home.</p>
        </div>

        {/* Game canvas */}
        <DinoGame />

        {/* Home link */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="text-[#4285f4] text-sm font-mono hover:underline"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
