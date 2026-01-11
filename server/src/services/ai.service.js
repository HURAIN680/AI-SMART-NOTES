import { getGroqClient } from "../config/groq.js";

export const generateSummary = async (content) => {
  const groq = getGroqClient();

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "user",
        content: `Summarize the following text in 2-3 lines:\n${content}`
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
        content: `Generate a short title for the following note:\n${content}`
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
        content: `Generate 3-5 relevant tags (comma separated) for:\n${content}`
      }
    ]
  });

  return response.choices[0].message.content
    .split(",")
    .map(tag => tag.trim());
};
