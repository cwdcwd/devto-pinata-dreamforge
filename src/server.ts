import express, { Express, Request, Response } from 'express'
import routerStories from './routes/api/stories'
import routerJobs from './routes/api/jobs'
import path from 'path'

const app: Express = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static content from the dist/public directory
app.use('/', express.static(path.join(__dirname, 'public')))

app.use('/api/stories', routerStories)
app.use('/api/jobs', routerJobs)

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
})