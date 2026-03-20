const express = require('express')
const app = express()
const cors = require('cors')
const path = require('path')

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
}))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/api/assignments', require('./routes/assignmentRouter'))

app.use(require('./middlewares/errorHandler'))

module.exports = { app }
