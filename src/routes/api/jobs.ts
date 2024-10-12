import { Router, Request, Response } from 'express'
import Queue from 'bull'
import generateStory from '../../helpers/generate'
import { REDIS_URL } from '../../helpers/const'
import { error } from 'console'

const router = Router()


const jobQueue = new Queue('jobQueue', REDIS_URL)

router.post('/', async (req, res) => {
  const job = await jobQueue.add({ prompt: req.body?.prompt })
  res.status(202).json({ message: 'Job submitted', jobId: job.id })
})

router.get('/:jobId', async (req, res) => {
  const job = await jobQueue.getJob(req.params.jobId)
  if (job === null) {
    res.status(404).json({ message: 'Job not found' })
  } else {
    const failed = await job.isFailed()
    res.json({ jobId: job.id, failedReason: job.failedReason, failed, status: job.finishedOn ? 'completed' : 'in progress' })
  }
});





export default router