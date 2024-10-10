import { env } from "process"
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { JsonOutputParser, StringOutputParser } from '@langchain/core/output_parsers'
import { DallEAPIWrapper } from "@langchain/openai"
import { StoryObject } from "../types/Story"
import { IMAGE_STYLE, LLM_OAI_KEY, MODEL_DALLE, MODEL_OAI, STORY_PARTS } from "./const"

// set up connection to Open AI with langchain
const model = new ChatOpenAI({
  model: MODEL_OAI,
  apiKey: LLM_OAI_KEY,
  temperature: 0.75
});

const generateImage = async (prompt: string) => {
  const tool = new DallEAPIWrapper({
    n: 1, // Default
    model: MODEL_DALLE, // Default
    apiKey: LLM_OAI_KEY,
    style: 'natural',
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

const createStory = async (prompt: string): Promise<StoryObject> => {
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
  return storyObj
}

export { generateImagePrompt, generateImage, generateHTML, createStory }