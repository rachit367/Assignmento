const { Queue } = require('bullmq')
const Redis = require('ioredis')

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
})

const aiGenerationQueue = new Queue('ai-generation', { 
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  }
})

async function addAIJob(assignmentId) {
  await aiGenerationQueue.add(
    'generate',
    { assignmentId },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  )
}

module.exports = { aiGenerationQueue, addAIJob }
