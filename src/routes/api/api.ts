import { Router, Request, Response } from 'express'
import { fetchGroupFiles, fetchPinataIndexFileContents, upsertPinataIndexGroup } from '../../helpers/pinata'
import { PINATA_INDEX_FILE_NAME, PINATA_INDEX_GROUP_NAME } from '../../helpers/const'


const router = Router()

router.get('/stories', async (req: Request, res: Response) => {
  const indexGroup = await upsertPinataIndexGroup(PINATA_INDEX_GROUP_NAME)
  const content = await fetchPinataIndexFileContents(indexGroup, PINATA_INDEX_FILE_NAME)
  const storiesGroups = content.split('\n')
  const stories = storiesGroups.map((storyGroup) => {
    const [groupId, title] = storyGroup.split(':')
    return { groupId, title }
  })
  res.json({ stories })
})

router.get('/stories/:id', async (req: Request, res: Response) => {
  const groupId = req.params.id
  const files = await fetchGroupFiles(groupId)
  const storyParts = files.files.map((file) => {
    return { name: file.name, cid: file.cid }
  })

  res.json({ storyParts })
})

// router.post('/', (req: Request, res: Response) => {
//   const jobId = startBackgroundJob() // Queue the job or start a worker
//   res.status(202).json({ message: 'Job submitted', jobId })
// })

export default router