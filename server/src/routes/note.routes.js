import express from "express";
import bcrypt from "bcryptjs";

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

// GET /notes/share/:id
router.get("/share/:id", async (req, res) => {
  try {
    const noteId = req.params.id;

    const note = await Note.findById(noteId).select("title content summary tags createdAt");
    if (!note) return res.status(404).json({ message: "Note not found" });

    res.json(note); // send minimal info only
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


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

router.patch("/:id/lock", async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ message: "PIN is required" });
    }

    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // LOCK
    if (!note.isLocked) {
      const hashedPin = await bcrypt.hash(pin, 10);
      note.isLocked = true;
      note.pinHash = hashedPin;
    }
    // UNLOCK
    else {
      const isMatch = await bcrypt.compare(pin, note.pinHash);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid PIN" });
      }

      note.isLocked = false;
      note.pinHash = null;
    }

    await note.save();
    res.json(note);
  } catch (error) {
    console.error("Lock Note Error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/verify-pin", async (req, res) => {
  try {
    const { pin } = req.body;
    const note = await Note.findById(req.params.id);

    if (!note || !note.isLocked) {
      return res.status(400).json({ message: "Note not locked" });
    }

    const isMatch = await bcrypt.compare(pin, note.pinHash);

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect PIN" });
    }

    res.json(note);
  } catch (err) {
    console.error("Verify PIN Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Toggle lock note(unlock permanently)
router.patch("/:id/unlock", async (req, res) => {
  try {
    const { pin } = req.body;
    const note = await Note.findById(req.params.id);

    if (!note || !note.isLocked) {
      return res.status(400).json({ message: "Note is not locked" });
    }

    const isMatch = await bcrypt.compare(pin, note.pinHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect PIN" });
    }

    // 🔓 Permanently unlock
    note.isLocked = false;
    note.pinHash = null;

    await note.save();

    res.json(note);
  } catch (err) {
    console.error("Unlock Note Error:", err);
    res.status(500).json({ message: err.message });
  }
});



router.get("/:id", getNoteById);
router.put("/:id", updateNote);
router.delete("/:id", deleteNote);




export default router;
