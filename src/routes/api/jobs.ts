import { Router, Request, Response } from 'express'
import Queue from 'bull'

const router = Router()


const jobQueue = new Queue('jobQueue', 'redis://127.0.0.1:6379')

router.post('/', async (req, res) => {
  const job = await jobQueue.add({ prompt: req.body?.prompt })
  res.status(202).json({ message: 'Job submitted', jobId: job.id })
})

router.get('/:jobId', async (req, res) => {
  const job = await jobQueue.getJob(req.params.jobId)
  if (job === null) {
    res.status(404).json({ message: 'Job not found' })
  } else {
    res.json({ jobId: job.id, status: job.finishedOn ? 'completed' : 'in progress' })
  }
});


jobQueue.process(async (job: any) => {
  // Long-running process here
  console.log('Processing job:', job.id)
  // ...do work...
});


export default router