import { env } from 'process'

import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { JsonOutputParser, StringOutputParser } from '@langchain/core/output_parsers'
import { DallEAPIWrapper } from "@langchain/openai"

import { AuthTestResponse, DeleteResponse, FileListItem, FileListResponse, GetCIDResponse, GroupListResponse, GroupResponseItem, PinataSDK, UploadResponse } from "pinata"

interface StoryPart {
  title: string
  content: string
}
interface StoryObject {
  title: string
  story: StoryPart[]
}

const LLM_OAI_KEY = env.LLM_OAI_KEY ?? ''
const PINTATA_JWT = env.PINTATA_JWT ?? ''
const PINTATA_GATEWAY = env.PINTATA_GATEWAY ?? 'aquamarine-smart-butterfly-519.mypinata.cloud'
const PINATA_INDEX_GROUP_NAME = env.PINATA_INDEX_GROUP_NAME ?? 'DREAMFORGE'
const PINATA_INDEX_FILE_NAME = env.PINATA_INDEX_FILE_NAME ?? 'index.txt'
const MODEL_OAI = env.MODEL_OAI ?? 'gpt-4o-mini'
const MODEL_DALLE = env.MODEL_DALLE ?? 'dall-e-3'
const STORY_PARTS = env.STORY_PARTS ?? 3
const IMAGE_STYLE = env.IMAGE_STYLE ?? 'Arthur Rackham'

// set up connection to Open AI with langchain
const model = new ChatOpenAI({
  model: MODEL_OAI,
  apiKey: LLM_OAI_KEY,
  temperature: 0.75
});


// get prompt from user for story topic and style of imagery and story
// generate story content
// generate prompts for N number of illustrations for the story
// geneerate illustrations
// sew content together in HTML
// push content to IPFS
// share URL to user

const upsertPinataIndexGroup = async (indexName: string) => {
  const pinata = new PinataSDK({
    pinataJwt: PINTATA_JWT,
    pinataGateway: PINTATA_GATEWAY,
  })

  let group: GroupResponseItem
  const groups: GroupListResponse = await pinata.groups.list().name(indexName)
  console.log(groups)
  if (groups.groups.length === 0) {
    console.log(`Cannot find index group: ${indexName}`)
    group = await pinata.groups.create({
      name: indexName,
      isPublic: true
    })
  } else {
    console.log('found groups')
    group = groups.groups[0]
  }
  console.log(group)
  return group
}

const updatePinataIndexFile = async (indexGroup: GroupResponseItem, fileName: string, content: string) => {
  let newContent 
  const pinata = new PinataSDK({
    pinataJwt: PINTATA_JWT,
    pinataGateway: PINTATA_GATEWAY,
  })

  const files: FileListResponse = await pinata.files.list().group(indexGroup.id).name(fileName)
  
  if (files.files.length === 0) {
    console.log('no index file found')
    newContent = content
  } else {
    console.log(`Found files: ${files.files.length} / ${JSON.stringify(files.files[0])}`)
    const fileFound: FileListItem = files.files[0]
    console.log(fileFound.cid)
    const file: GetCIDResponse = await pinata.gateways.get(fileFound.cid)
    const data = file.data as Blob
    newContent = await data.text() + `\n${content}`
    console.log(`updating the index file: ${newContent}`)
    const deleteResp: DeleteResponse[] = await pinata.files.delete([fileFound.cid])
    console.log(`deleted original file: ${JSON.stringify(deleteResp)}`)
  }

  console.log('creating new index file')
  const blob = new Blob([newContent], { type: 'text/plain' })
  const file = new File([blob], 'index.txt', { type: 'text/plain' })
  const upload: UploadResponse = await pinata.upload
    .file(file)
    .group(indexGroup.id)
    .addMetadata({
      name: fileName
    })

  console.log(upload)
  return upload
}

const pushToPinata = async (content: StoryObject, images: string[]) => {
  const pinata = new PinataSDK({
    pinataJwt: PINTATA_JWT,
    pinataGateway: PINTATA_GATEWAY,
  })
  
  const resp: AuthTestResponse = await pinata.testAuthentication()
  console.log(resp)
  if (!resp.message) {
    console.log('bad credentials')
    return 
  }


  const group: GroupResponseItem = await pinata.groups.create({
    name: content.title,
    isPublic: true
  })

  const imagesUploaded: UploadResponse[] = await Promise.all(images.map(async (image: string, index: number) => {
    const upload: UploadResponse = await pinata.upload
      .url(image)
      .group(group.id)
      .addMetadata({
        name: `image_${index}` 
      })

    return upload
  }))

  const contentUpload: UploadResponse[] = await Promise.all(content.story.map(async (storyPart: StoryPart, index: number) => {
    const blob = new Blob([storyPart.content], { type: 'text/plain' })
    const file = new File([blob], `text_${index}`, { type: 'text/plain' })
    const upload = await pinata.upload
      .file(file)
      .group(group.id)
      .addMetadata({
        name: `text_${index}`
    })
    return upload
  }))
    
  return { group, contentUpload, imagesUploaded }
}

const generateImage = async (prompt: string) => {
  const tool = new DallEAPIWrapper({
    n: 1, // Default
    model: MODEL_DALLE, // Default
    apiKey: LLM_OAI_KEY
  })

  const imageURL = await tool.invoke(prompt)
  return imageURL
}

const generateHTML = (content: string[], images: string[]) => {
  const messages = [
  ]
}

const generateImagePrompt = async (content: string) => {
  console.log('generating image prompt for: ', content)
  const messages = [
    new SystemMessage(`You are an expert in creating image prompts for DallE. Generate a DallE image prompt for anything the user says. The style of the image should be ${IMAGE_STYLE}`),
    new HumanMessage(content)
  ]

  const resp = await model.invoke(messages)
  const parsed = new StringOutputParser()
  return await parsed.invoke(resp)
}

const main = async (prompt: string) => {
  const indexGroup = await upsertPinataIndexGroup(PINATA_INDEX_GROUP_NAME)

  const messages = [
    new SystemMessage('You are an expert story teller, especially in regards to Grimms fairy tales and other classical stories.'),
    new HumanMessage(`tell me a story around this concept ${prompt}. The story should have ${STORY_PARTS} parts. Return the story as a JSON object that has the title of the story in a field called "title" and an array called "story" with the story parts in the form "title" and "content". Only return the JSON and nothing else`),
  ]

  const resp = await model.invoke(messages)
  const parser = new JsonOutputParser()
  const storyObj: StoryObject = { title: 'tbd', story: [] }
  const parsed = await parser.invoke(resp)
  console.log(parsed)
  storyObj.title = parsed.title
  storyObj.story = parsed.story

  const aImagePrompts = await Promise.all(storyObj.story.map(async (storyPart) => {
    return await generateImagePrompt(storyPart.content)
  }))

  console.log(aImagePrompts)

  const imageURLs = await Promise.all(aImagePrompts.map(async (imagePrompt) => {
    return await generateImage(prompt)
  }))

  console.log(imageURLs)

  //save images to IPFS
  const pinataUploads = await pushToPinata(storyObj, imageURLs)
  console.log(pinataUploads)
  const indexFile = await updatePinataIndexFile(indexGroup, PINATA_INDEX_FILE_NAME, pinataUploads?.group?.id ?? '')
  console.log(indexFile)
}

main('a story about an anthropomorphic bear who discovers a mine full of honey')
