import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, lazy, Suspense } from 'react'

const VideoTemplate = lazy(() => import('@/components/video/VideoTemplate'))

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <div className="w-full h-screen bg-[#0b0d12]" />
  return <>{children}</>
}

export const Route = createFileRoute('/video')({
  component: () => (
    <ClientOnly>
      <Suspense fallback={<div className="w-full h-screen bg-[#0b0d12]" />}>
        <VideoTemplate />
      </Suspense>
    </ClientOnly>
  ),
})
