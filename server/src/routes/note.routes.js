import express from "express";

import  protect  from "../middleware/auth.middleware.js";
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote
} from "../controllers/note.controller.js";
import Note from "../models/note.model.js";



const router = express.Router();

router.use(protect);

router.post("/", createNote);
router.get("/", getNotes);
router.patch("/:id/pin", async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Note not found" });

    note.isPinned = !note.isPinned; // toggle pin
    await note.save();

    res.json(note); // send back updated note
  } catch (err) {
    console.error("Pin Note Error:", err); // <- log the error
    res.status(500).json({ message: err.message });
  }
});
router.get("/:id", getNoteById);
router.put("/:id", updateNote);
router.delete("/:id", deleteNote);




export default router;