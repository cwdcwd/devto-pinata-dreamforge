import { env } from "process"
import { createStory, generateImage, generateImagePrompt } from "./oai"
import { pushToPinata, updatePinataIndexFile, upsertPinataIndexGroup } from "./pinata"
import { PINATA_INDEX_FILE_NAME, PINATA_INDEX_GROUP_NAME } from "./const"

const generateStory = async (prompt: string) => {
  const indexGroup = await upsertPinataIndexGroup(PINATA_INDEX_GROUP_NAME)
  const storyObj = await createStory(prompt)

  const aImagePrompts = await Promise.all(storyObj.story.map(async (storyPart) => {
    return await generateImagePrompt(storyPart.content)
  }))

  console.log(aImagePrompts)

  const imageURLs = await Promise.all(aImagePrompts.map(async (imagePrompt) => {
    return await generateImage(imagePrompt)
  }))

  console.log(imageURLs)

  //save images to IPFS
  const pinataUploads = await pushToPinata(storyObj, imageURLs)
  console.log(pinataUploads)
  const content = (pinataUploads?.group?.id ?? '') + `:${storyObj.title}` 
  const indexFile = await updatePinataIndexFile(indexGroup, PINATA_INDEX_FILE_NAME, content)
  console.log(indexFile)
}

export default generateStory
// main('a story about an anthropomorphic bear who discovers a mine full of honey')
