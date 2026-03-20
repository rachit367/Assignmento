'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSocket } from '@/lib/socket'
import { useAssignmentStore } from '@/store/useAssignmentStore'
import { IGeneratedContent } from '@/types/assignment'

export function useSocket(assignmentId?: string) {
  const router = useRouter()
  const { updateGenerationStatus, setGeneratedContent } = useAssignmentStore()

  useEffect(() => {
    const socket = getSocket()

    if (assignmentId) {
      socket.emit('subscribe:assignment', assignmentId)
    } else {
      socket.emit('subscribe:dashboard')
    }

    const onQueued = ({ assignmentId: id }: { assignmentId: string }) => {
      updateGenerationStatus(id, 'pending')
    }

    const onProcessing = ({ assignmentId: id }: { assignmentId: string }) => {
      updateGenerationStatus(id, 'processing')
    }

    const onComplete = ({
      assignmentId: id,
      generatedContent,
    }: {
      assignmentId: string
      generatedContent: IGeneratedContent
    }) => {
      updateGenerationStatus(id, 'complete')
      setGeneratedContent(id, generatedContent)
      if (assignmentId && assignmentId === id) {
        router.push(`/assignments/${id}`)
      }
    }

    const onError = ({ assignmentId: id }: { assignmentId: string; error: string }) => {
      updateGenerationStatus(id, 'error')
    }

    socket.on('generation:queued', onQueued)
    socket.on('generation:processing', onProcessing)
    socket.on('generation:complete', onComplete)
    socket.on('generation:error', onError)

    return () => {
      socket.off('generation:queued', onQueued)
      socket.off('generation:processing', onProcessing)
      socket.off('generation:complete', onComplete)
      socket.off('generation:error', onError)
      if (assignmentId) {
        socket.emit('unsubscribe:assignment', assignmentId)
      }
    }
  }, [assignmentId, router, updateGenerationStatus, setGeneratedContent])
}
