import express, { Express, Request, Response } from 'express'
import routerStories from './routes/api/stories'
import routerJobs from './routes/api/jobs'

const app: Express = express()
const port = process.env.PORT || 3000

app.use('/api/stories', routerStories)
app.use('/api/jobs', routerJobs)

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
})