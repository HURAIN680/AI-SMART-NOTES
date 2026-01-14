import { getGroqClient } from "../config/groq.js";

export const generateSummary = async (content) => {
  const groq = getGroqClient();

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "user",
        content: `Summarize the following text in 2-3 lines
        do not start with here is a summary of.. directly start with the summary \n${content}`
      }
    ]
  });

  return response.choices[0].message.content;
};

export const generateTitle = async (content) => {
  const groq = getGroqClient();

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "user",
        content: `Generate 1 short title for the following note 
        do not start with "here is a short title...directlty start with title\n${content}`
      }
    ]
  });

  return response.choices[0].message.content;
};

export const generateTags = async (content) => {
  const groq = getGroqClient();

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "user",
        content: `Generate 3-5 relevant tags (comma separated) for the note. Do not make a tag saying here are the tags for the given content....:\n${content}`
      }
    ]
  });

  return response.choices[0].message.content
    .split(",")
    .map(tag => tag.trim());
};
