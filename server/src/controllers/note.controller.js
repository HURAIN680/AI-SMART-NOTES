import Note from "../models/note.model.js";


// CREATE NOTE
export const createNote = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
        }
        

    const note = await Note.create({
      title,
      content,
      userId: req.user.id
    });

    res.status(201).json(note);

  } catch (error) {
    console.error("CREATE NOTE ERROR:", error);
    res.status(500).json({ message: "Failed to create note" });
  }
};


// GET ALL NOTES (USER SPECIFIC)
export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
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
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(note);
  } catch (error) {
    console.error(error.message);
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