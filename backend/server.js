const dotenv = require('dotenv')
const path = require('path')
dotenv.config({ path: path.join(__dirname, '.env') })

// Validate required env vars immediately after dotenv loads.
// Fail fast with a clear message rather than mysterious errors at runtime.
const { z } = require('zod')
const envSchema = z.object({
  MONGO_URI: z.string().min(1),
  REDIS_URL: z.string().min(1),
  OPENROUTER_API_KEY: z.string().min(1),
  FRONTEND_URL: z.string().url(),
})
const envResult = envSchema.safeParse(process.env)
if (!envResult.success) {
  const missing = envResult.error.issues.map((i) => `  - ${i.path[0]}: ${i.message}`).join('\n')
  console.error(`Missing or invalid environment variables:\n${missing}`)
  process.exit(1)
}

const { app } = require('./app')
const { connectDB } = require('./config/db')
const { Server } = require('socket.io')
const { createServer } = require('http')
const { attachSocketHandlers } = require('./socket/socketHandler')
const { initWorker } = require('./workers/aiWorker')

const server = createServer(app)
const PORT = process.env.PORT || 3000

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})

app.locals.io = io
attachSocketHandlers(io)

connectDB().then(() => {
  initWorker(io)
  server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
  })
}).catch((err) => {
  console.error('Failed to connect to DB:', err)
  process.exit(1)
})
