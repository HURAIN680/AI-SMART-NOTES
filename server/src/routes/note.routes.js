import express from "express";

import  protect  from "../middleware/auth.middleware.js";
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote
} from "../controllers/note.controller.js";



const router = express.Router();

router.use(protect);

router.post("/", createNote);
router.get("/", getNotes);
router.get("/:id", getNoteById);
router.put("/:id", updateNote);
router.delete("/:id", deleteNote);




export default router;