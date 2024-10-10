import { AuthTestResponse, DeleteResponse, FileListItem, FileListResponse, GetCIDResponse, GroupListResponse, GroupResponseItem, PinataSDK, UploadResponse } from "pinata"
import { env } from "process"
import { StoryObject, StoryPart } from "../types/Story"
import exp from "constants"


const PINTATA_JWT = env.PINTATA_JWT ?? ''
const PINTATA_GATEWAY = env.PINTATA_GATEWAY ?? 'aquamarine-smart-butterfly-519.mypinata.cloud'

const pinata = new PinataSDK({
  pinataJwt: PINTATA_JWT,
  pinataGateway: PINTATA_GATEWAY,
})

const upsertPinataIndexGroup = async (indexName: string) => {
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

const fetchGroupFiles = async (groupCId: string) => {
  const files: FileListResponse = await pinata.files.list().group(groupCId)
  console.log(files)
  return files
}

const fetchFile = async (fileCId: string, asString?: boolean): Promise<string | Blob> => {
  const file: GetCIDResponse = await pinata.gateways.get(fileCId)
  console.log(file)
  const data = file.data as Blob

  if (asString)
    return await data.text() 

  return data
}

const fetchPinataIndexFileContents = async (indexGroup: GroupResponseItem, fileName: string): Promise<String> => {
  const files: FileListResponse = await pinata.files.list().group(indexGroup.id).name(fileName)
  console.log(files)

  if (files.files.length === 0) {
    console.log('no index file found')
    return ''
  }

  console.log(`Found files: ${files.files.length} / ${JSON.stringify(files.files[0])}`)
  const fileFound: FileListItem = files.files[0]
  console.log(fileFound.cid)
  const file: GetCIDResponse = await pinata.gateways.get(fileFound.cid)
  const data = file.data as Blob
  return await data.text() 
}

const updatePinataIndexFile = async (indexGroup: GroupResponseItem, fileName: string, content: string) => {
  let newContent: string
  const files: FileListResponse = await pinata.files.list().group(indexGroup.id).name(fileName)

  if (files.files.length === 0) {
    console.log('no index file found')
    newContent = content
  } else {
    console.log(`Found files: ${files.files.length} / ${JSON.stringify(files.files[0])}`)
    const fileFound: FileListItem = files.files[0]
    console.log(fileFound.cid)
    newContent = await fetchFile(fileFound.cid, true) as string
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

export { upsertPinataIndexGroup, updatePinataIndexFile, pushToPinata, fetchPinataIndexFileContents, fetchGroupFiles, fetchFile }