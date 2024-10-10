import express, { Express, Request, Response } from 'express'
import router from './routes/api/api'

const app: Express = express()
const port = process.env.PORT || 3000

app.use('/api', router)

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`)
})