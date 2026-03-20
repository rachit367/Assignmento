const { Worker } = require('bullmq')
const Redis = require('ioredis')
const Assignment = require('../models/assignmentModel')
const { handleGenerateAssessment } = require('../services/aiService')

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
})

function initWorker(io) {
  const worker = new Worker(
    'ai-generation',
    async (job) => {
      const { assignmentId } = job.data

      // Atomically transition from 'pending' → 'processing'.
      // If another worker already picked this job up (or assignment was deleted),
      // findOneAndUpdate returns null and we bail out without double-processing.
      const assignment = await Assignment.findOneAndUpdate(
        { _id: assignmentId, status: 'pending' },
        { status: 'processing' },
        { new: true }
      )
      if (!assignment) {
        console.warn(`Skipping job for ${assignmentId}: not found or already processing`)
        return
      }

      io.to(`assignment:${assignmentId}`).emit('generation:processing', { assignmentId })
      io.to('dashboard').emit('generation:processing', { assignmentId })

      const generatedContent = await handleGenerateAssessment(assignment)

      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'complete',
        generatedContent,
        errorMessage: undefined,
      })

      io.to(`assignment:${assignmentId}`).emit('generation:complete', {
        assignmentId,
        generatedContent,
      })
      io.to('dashboard').emit('generation:complete', {
        assignmentId,
        generatedContent,
      })
    },
    { connection }
  )

  worker.on('failed', async (job, err) => {
    console.error(`Job failed for ${job?.data?.assignmentId}:`, err.message)
    if (job) {
      const { assignmentId } = job.data
      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'error',
        errorMessage: err.message,
      })
      io.to(`assignment:${assignmentId}`).emit('generation:error', {
        assignmentId,
        error: err.message,
      })
      io.to('dashboard').emit('generation:error', {
        assignmentId,
        error: err.message,
      })
    }
  })

  worker.on('error', (err) => {
    console.error('Worker infrastructure error (Redis/BullMQ):', err.message)
    // Any assignments stuck in 'processing' from a previous crash are recovered
    // by the startup cleanup below. This handler can't target a specific job since
    // it fires for connection-level errors, not job-level errors.
  })

  // On startup, recover any assignments that were left in 'processing' state
  // from a prior worker crash (they will never receive a 'failed' event).
  Assignment.updateMany(
    { status: 'processing' },
    { status: 'error', errorMessage: 'Generation interrupted — worker restarted. Please try again.' }
  ).then((result) => {
    if (result.modifiedCount > 0) {
      console.warn(`Recovered ${result.modifiedCount} assignment(s) stuck in 'processing' state`)
    }
  }).catch((err) => {
    console.error('Failed to recover stuck assignments on startup:', err.message)
  })

  console.log('AI generation worker started')
  return worker
}

module.exports = { initWorker }
