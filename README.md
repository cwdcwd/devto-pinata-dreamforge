# DreamForge: AI Generated Stories

*This is a submission for the [The Pinata Challenge ](https://dev.to/challenges/pinata)*

## What I Built
This is an LLM-backed story generator that creates a story from an intial prompt and then generates illustrations for that story. The story and images are then stored and retrieved via Pinata's Files SDK. This system comprises of an Express-based API, a rudimentary front end, and a background processor for the long running LLM operations. There is a Redis instance for queue management for the long running generation processes. 

## Demo
[The Dream Forge](https://dreamforge.lazybaer.com/) 

## My Code
[DreamForge on Github](https://github.com/cwdcwd/devto-pinata-dreamforge)

## More Details
Pinata's File SDK is used here for a number operations. Namely it is being used as both a file share as well as a database. Firstly, a group is created called `DREAMFORGE` that an index file is placed in that group that will hold other groupIds. The story is generated and a corresponding file group created for that story. This groupId along with the story title is held in the index. 
Subsequently the generated text and image content is put up on Pinata and tagged to the specific group created for the story. In this way I'm using the index file as a database to look up my stories and then fetching files based on the groupIds in the index. I wrapped a several RESTful endpoints around the Pinata services to fetch the stories and their content. 
Due to the long running nature of generating the LLM content the front end web page posts the story prompt to the API which then hands off the prompt to the Redis queue for processing so the API can quickly respond. The front end then calls an endpoint to check on the job being processed and when the job is completed the front end then refreshes the listing of stories which are in the index file on Pinata. 
Clicking on a story title fetches the appropriate files off Pinata via the API and displays them.


<!-- Don't forget to add a cover image (if you want). -->

<!-- Thanks for participating! -->
