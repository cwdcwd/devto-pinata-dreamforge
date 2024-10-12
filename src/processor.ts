import Queue, { Job } from 'bull'
import { REDIS_URL } from './helpers/const'
import generateStory from './helpers/generate'


const jobQueue = new Queue('jobQueue', REDIS_URL)

jobQueue.process(async (job: Job) => {
  try { 
    console.log('Processing job:', job.id)
    job.log('Starting job')
    job.progress(0)
    await generateStory(job.data.prompt)
    job.progress(100)
    return { status: 'completed' }
  } catch (e) {
    console.error(e)

    if(e instanceof Error) {
      job.failedReason = e.message
    }
    throw e
    // return { status: 'failed' }
  }
})