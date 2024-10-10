import { env } from "process"

const PINATA_INDEX_GROUP_NAME = env.PINATA_INDEX_GROUP_NAME ?? 'DREAMFORGE'
const PINATA_INDEX_FILE_NAME = env.PINATA_INDEX_FILE_NAME ?? 'index.txt'

const LLM_OAI_KEY = env.LLM_OAI_KEY ?? ''
const MODEL_OAI = env.MODEL_OAI ?? 'gpt-4o-mini'
const MODEL_DALLE = env.MODEL_DALLE ?? 'dall-e-3'
const STORY_PARTS = env.STORY_PARTS ?? 3
const IMAGE_STYLE = env.IMAGE_STYLE ?? 'Arthur Rackham'

export {
  PINATA_INDEX_GROUP_NAME,
  PINATA_INDEX_FILE_NAME,
  LLM_OAI_KEY,
  MODEL_OAI,
  MODEL_DALLE,
  STORY_PARTS,
  IMAGE_STYLE,
}