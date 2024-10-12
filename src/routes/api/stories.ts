import { Router, Request, Response } from 'express'
import Queue, { Job } from 'bull'
import { fetchFile, fetchGroupFiles, fetchPinataIndexFileContents, upsertPinataIndexGroup } from '../../helpers/pinata'
import { PINATA_INDEX_FILE_NAME, PINATA_INDEX_GROUP_NAME, REDIS_URL } from '../../helpers/const'


const router = Router()
const jobQueue = new Queue('jobQueue', REDIS_URL)

router.get('/', async (req: Request, res: Response) => {
  try {
    const indexGroup = await upsertPinataIndexGroup(PINATA_INDEX_GROUP_NAME)
    const content = await fetchPinataIndexFileContents(indexGroup, PINATA_INDEX_FILE_NAME)

    if (!content) {
      res.status(404).json({ message: 'Index not found' })
      return
    }

    const storiesGroups = content.split('\n')
    const stories = storiesGroups.map((storyGroup) => {
      const [groupId, title] = storyGroup.split('\t')
      return { groupId, title }
    })
    res.json({ stories })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Error fetching stories' })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id
    const files = await fetchGroupFiles(groupId)
    const storyParts = files.files.map((file) => {
      return { name: file.name, cid: file.cid }
    })

    res.json({ storyParts })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Error fetching story' })
  }
})

router.get('/:id/:part', async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id
    const partName = req.params.part
    const files = await fetchGroupFiles(groupId)
    const storyPart = files.files.find((file) => file.name === partName)
    if (!storyPart) {
      res.status(404).json({ message: 'Part not found' })
      return
    }

    if (storyPart.name?.startsWith('image')) {
      const imageBlob = await fetchFile(storyPart.cid) as Blob
      const image = Buffer.from(await imageBlob.arrayBuffer())
      res.setHeader('Content-Type', 'image/png')
      res.send(image)
      return
    } else {
      const text = await fetchFile(storyPart.cid, true)
      res.json({ text })
    }
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Error fetching story part' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body
    const job: Job = await jobQueue.add({ prompt })
    res.status(202).json({ message: 'Job submitted', jobId: job.id })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: 'Error submitting job' })
  }
})

export default router