import { getGroqClient } from "../config/groq.js";

// Helper to strip HTML tags for clean AI processing
function cleanText(html) {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// Built-in intelligent fallback for summary
function fallbackSummary(text) {
  if (!text) return "";
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .filter(s => s.trim().length > 10);

  if (sentences.length > 0) {
    return sentences.slice(0, 2).join(" ");
  }
  return text.slice(0, 150) + (text.length > 150 ? "..." : "");
}

// Built-in intelligent fallback for title
function fallbackTitle(text) {
  if (!text) return "Untitled Note";
  const clean = text.replace(/[#*_\n\r]/g, " ").trim();
  const words = clean.split(/\s+/).slice(0, 6).join(" ");
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Untitled Note";
}

// Built-in intelligent fallback for tags
function fallbackTags(text) {
  if (!text) return ["Ideas"];
  const lower = text.toLowerCase();
  const candidates = [];

  const keywords = [
    "design", "marketing", "research", "ideas", "draft", "meeting",
    "project", "todo", "strategy", "roadmap", "features", "backend",
    "frontend", "growth", "culture", "finance", "workflow", "gardening",
    "security", "analytics", "learning"
  ];

  keywords.forEach(kw => {
    if (lower.includes(kw)) {
      candidates.push(kw.charAt(0).toUpperCase() + kw.slice(1));
    }
  });

  if (candidates.length === 0) {
    candidates.push("Ideas", "Personal");
  }

  return candidates.slice(0, 4);
}

// Helper to call Groq with resilient model fallback
async function callGroqWithFallback(groq, messages, maxTokens = 150) {
  const models = [
    "llama-3.3-70b-versatile",
    "llama3-8b-8192",
    "mixtral-8x7b-32768",
    "gemma2-9b-it"
  ];

  for (const model of models) {
    try {
      const response = await groq.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens
      });
      const text = response.choices[0]?.message?.content?.trim();
      if (text) return text;
    } catch (err) {
      console.warn(`Groq model ${model} failed, trying next:`, err.message);
    }
  }

  throw new Error("All Groq models failed");
}

export const generateSummary = async (content) => {
  const plainText = cleanText(content);
  if (!plainText) return "";

  if (!process.env.GROQ_API_KEY) {
    return fallbackSummary(plainText);
  }

  try {
    const groq = getGroqClient();
    const result = await callGroqWithFallback(
      groq,
      [
        {
          role: "user",
          content: `Summarize the following text in 2 concise sentences without conversational filler:\n${plainText}`
        }
      ],
      150
    );

    return result || fallbackSummary(plainText);
  } catch (error) {
    console.warn("Groq generateSummary error, using smart fallback:", error.message);
    return fallbackSummary(plainText);
  }
};

export const generateTitle = async (content) => {
  const plainText = cleanText(content);
  if (!plainText) return "Untitled Note";

  if (!process.env.GROQ_API_KEY) {
    return fallbackTitle(plainText);
  }

  try {
    const groq = getGroqClient();
    const result = await callGroqWithFallback(
      groq,
      [
        {
          role: "user",
          content: `Generate a concise 3-5 word title for this note without quotes or introductory phrases:\n${plainText}`
        }
      ],
      30
    );

    const cleanTitle = result?.replace(/^["']|["']$/g, "")?.trim();
    return cleanTitle || fallbackTitle(plainText);
  } catch (error) {
    console.warn("Groq generateTitle error, using smart fallback:", error.message);
    return fallbackTitle(plainText);
  }
};

export const generateTags = async (content) => {
  const plainText = cleanText(content);
  if (!plainText) return ["Ideas"];

  if (!process.env.GROQ_API_KEY) {
    return fallbackTags(plainText);
  }

  try {
    const groq = getGroqClient();
    const result = await callGroqWithFallback(
      groq,
      [
        {
          role: "user",
          content: `Generate 3-4 relevant comma-separated tags for this note without preamble:\n${plainText}`
        }
      ],
      50
    );

    if (result) {
      const parsed = result
        .split(/[,#\n]/)
        .map(t => t.trim().replace(/^["']|["']$/g, ""))
        .filter(t => t.length > 1 && !t.toLowerCase().includes("tag"));
      if (parsed.length > 0) return parsed.slice(0, 5);
    }
    return fallbackTags(plainText);
  } catch (error) {
    console.warn("Groq generateTags error, using smart fallback:", error.message);
    return fallbackTags(plainText);
  }
};
