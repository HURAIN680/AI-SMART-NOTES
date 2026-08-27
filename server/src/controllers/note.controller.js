import mongoose from "mongoose";
import Note from "../models/note.model.js";
import { getGroqClient } from "../config/groq.js";



export const createNote = async (req, res) => {
  try {
    const { title, content, tags, color } = req.body;

    if (!content && !title) {
      return res.status(400).json({ message: "Content or title is required" });
    }

    const note = await Note.create({
      userId: req.user._id,
      title: title?.trim() || "Untitled Note",
      content: content || "",
      summary: "",
      tags: Array.isArray(tags) ? tags : [],
      color: color || "default"
    });

    res.status(201).json(note);
  } catch (error) {
    console.error("CREATE NOTE ERROR:", error);
    res.status(500).json({ message: error.message || "Failed to create note" });
  }
};


// GET ALL NOTES by user with search
export const getNotes = async (req, res) => {
  try {
    const { search } = req.query;

    const query = {
      userId: req.user.id
    };

    if (search && search.trim() !== "") {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } }
      ];
    }

    const notes = await Note.find(query).sort({ isPinned: -1, createdAt: -1 });

    res.json(notes);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Failed to fetch notes" });
  }
};

// GET SINGLE NOTE
export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: "Error fetching note" });
  }
};

// UPDATE NOTE
export const updateNote = async (req, res) => {
  try {
    const { title, content, color, tags } = req.body;
    const updateData = {};

    if (color !== undefined) updateData.color = color;
    if (tags !== undefined) updateData.tags = tags;
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true }
    );

    if (!note) return res.status(404).json({ message: "Note not found" });

    res.json(note);
  } catch (error) {
    console.error("UPDATE NOTE ERROR:", error);
    res.status(500).json({ message: "Failed to update note" });
  }
};


// DELETE NOTE
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json({ message: "Note deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete note" });
  }
};


// ASK AI — answer a question about a specific note
export const askNoteQuestion = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Strip HTML tags to get plain text for the AI context
    const textContent = note.content?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "";

    if (!textContent) {
      return res.status(400).json({ message: "Note has no content to query" });
    }

    if (!process.env.GROQ_API_KEY) {
      // Intelligent local search match
      const lowerText = textContent.toLowerCase();
      const lowerQ = question.toLowerCase();
      const keywords = lowerQ.split(" ").filter(w => w.length > 3);
      const matches = textContent.split(/(?<=[.?!])\s+/).filter(sentence =>
        keywords.some(kw => sentence.toLowerCase().includes(kw))
      );

      const answer = matches.length > 0
        ? `Based on your note: "${matches.slice(0, 2).join(" ")}"`
        : `Summary of "${note.title || "Note"}": ${textContent.slice(0, 180)}...`;

      return res.json({ answer });
    }

    try {
      const groq = getGroqClient();
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant. Answer questions based ONLY on the provided note content. Be concise, accurate, and direct. If the note doesn't contain enough information to answer the question, say so clearly.",
          },
          {
            role: "user",
            content: `Note title: ${note.title || "Untitled"}\n\nNote content:\n${textContent}\n\nQuestion: ${question}`,
          },
        ],
      });

      res.json({ answer: response.choices[0].message.content });
    } catch (groqErr) {
      console.warn("Groq query error, returning smart excerpt:", groqErr.message);
      res.json({
        answer: `From "${note.title || "Note"}": ${textContent.slice(0, 200)}...`
      });
    }
  } catch (error) {
    console.error("Ask AI Error:", error);
    res.status(500).json({ message: "Failed to get AI answer" });
  }
};
