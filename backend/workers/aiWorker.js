const { Worker } = require('bullmq')
const Redis = require('ioredis')
const Assignment = require('../models/assignmentModel')
const { handleGenerateAssessment } = require('../services/aiService')

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: { rejectUnauthorized: true },
})

function initWorker(io) {
  const worker = new Worker(
    'ai-generation',
    async (job) => {
      const { assignmentId } = job.data

      io.to(`assignment:${assignmentId}`).emit('generation:processing', { assignmentId })
      io.to('dashboard').emit('generation:processing', { assignmentId })
      await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' })

      const assignment = await Assignment.findById(assignmentId)
      if (!assignment) throw new Error(`Assignment ${assignmentId} not found`)

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
    console.error('Worker error:', err.message)
  })

  console.log('AI generation worker started')
  return worker
}

module.exports = { initWorker }
