interface StoryPart {
  title: string
  content: string
}
interface StoryObject {
  title: string
  story: StoryPart[]
}

export { StoryPart, StoryObject }