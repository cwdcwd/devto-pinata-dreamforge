import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { DallEAPIWrapper } from "@langchain/openai"

import { env } from 'process'


const LLM_OAI_KEY = env.LLM_OAI_KEY ?? ''
const MODEL_OAI = 'gpt-4o-mini'
const STORY_PARTS = 5

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

const generateImage = async (prompt: string) => {
  const tool = new DallEAPIWrapper({
    n: 1, // Default
    model: "dall-e-3", // Default
    apiKey: process.env.OPENAI_API_KEY, // Default
  })

  const imageURL = await tool.invoke("a painting of a cat")

  console.log(imageURL)
}

const main = async (prompt: string) => {
  const messages = [
    new SystemMessage('You are an expert story teller, especially in regards to Grimms fairy tales and other classical stories.'),
    new HumanMessage(`tell me a story around this concept ${prompt}. The story should have ${STORY_PARTS} parts. Return the story as a JSON object that has an array of the parts in the form "title" and "content". Only return the JSON and nothing else`),
  ]

  const resp = await model.invoke(messages)
  console.log(resp)
}

main('a story about an anthropomorphic bear who discovers a mine full of honey')