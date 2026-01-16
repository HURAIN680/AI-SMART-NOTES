import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  Plus, Search, LogOut, Edit3, Trash2, X,
  Undo, Redo, Calendar, Tag, FileText, Sparkles
} from "lucide-react";

function Notes() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showCreateBox, setShowCreateBox] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [openNote, setOpenNote] = useState(null);
  const [editContent, setEditContent] = useState("");

  const [undoStackCreate, setUndoStackCreate] = useState([]);
  const [redoStackCreate, setRedoStackCreate] = useState([]);
  const [undoStackEdit, setUndoStackEdit] = useState([]);
  const [redoStackEdit, setRedoStackEdit] = useState([]);

  /* ---------------- FETCH NOTES ---------------- */
  const fetchNotes = async (query = "") => {
    try {
      setLoading(true);
      const res = await api.get("/notes", {
        params: { search: query }
      });
      setNotes(res.data);
    } catch (err) {
      console.error("Failed to fetch notes");
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchNotes(search), 300);
    return () => clearTimeout(delay);
  }, [search]);

  /* ---------------- CREATE NOTE ---------------- */
  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const res = await api.post("/notes", { title, content });
      setNotes([res.data, ...notes]);
      setTitle("");
      setContent("");
      setUndoStackCreate([]);
      setRedoStackCreate([]);
      setShowCreateBox(false);
    } catch {
      console.error("Failed to create note");
    }
  };

  /* ---------------- DELETE NOTE ---------------- */
  const handleDeleteNote = async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      setNotes(notes.filter((n) => n._id !== id));
    } catch {
      console.error("Delete failed");
    }
  };

  /* ---------------- UPDATE TITLE ---------------- */
  const handleUpdateTitle = async (id) => {
    if (!editingTitle.trim()) return setEditingNoteId(null);

    try {
      const res = await api.put(`/notes/${id}`, { title: editingTitle });
      setNotes(notes.map(n => n._id === id ? res.data : n));
      setEditingNoteId(null);
      setEditingTitle("");
    } catch {
      console.error("Update title failed");
    }
  };

  /* ---------------- UPDATE CONTENT ---------------- */
  const handleUpdateContent = async () => {
    if (!editContent.trim()) return;

    try {
      const res = await api.put(`/notes/${openNote._id}`, {
        content: editContent
      });
      setNotes(notes.map(n => n._id === openNote._id ? res.data : n));
      setOpenNote(null);
      setUndoStackEdit([]);
      setRedoStackEdit([]);
    } catch {
      console.error("Update content failed");
    }
  };

  /* ---------------- LOGOUT ---------------- */
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  /* ---------------- UNDO / REDO ---------------- */
  const undo = (stack, setStack, redo, setRedo, value, setValue) => {
    if (!stack.length) return;
    setRedo([value, ...redo]);
    setValue(stack.at(-1));
    setStack(stack.slice(0, -1));
  };

  const redo = (stack, setStack, undo, setUndo, value, setValue) => {
    if (!stack.length) return;
    setUndo([...undo, value]);
    setValue(stack[0]);
    setStack(stack.slice(1));
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">My Notes</h1>
        <button onClick={handleLogout} className="text-red-400 flex gap-2">
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-3 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes..."
          className="w-full pl-12 py-3 rounded-xl bg-white/5 border border-white/10"
        />
      </div>

      {/* New Note */}
      <button
        onClick={() => setShowCreateBox(!showCreateBox)}
        className="mb-6 flex items-center gap-2 bg-violet-600 px-6 py-3 rounded-xl"
      >
        <Plus /> New Note <Sparkles size={16} />
      </button>

      {/* Create Box */}
      {showCreateBox && (
        <form onSubmit={handleCreateNote} className="bg-white/10 p-6 rounded-xl mb-6">
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-3 px-4 py-2 bg-white/5 rounded-lg"
          />
          <textarea
            rows={5}
            value={content}
            onChange={(e) => {
              setUndoStackCreate([...undoStackCreate, content]);
              setContent(e.target.value);
              setRedoStackCreate([]);
            }}
            className="w-full px-4 py-2 bg-white/5 rounded-lg"
          />
          <div className="mt-4 flex gap-3">
            <button className="bg-violet-600 px-4 py-2 rounded-lg">Save</button>
            <button type="button" onClick={() => setShowCreateBox(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Notes */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4">
          {notes.map(note => (
            <div
              key={note._id}
              onClick={() => {
                setOpenNote(note);
                setEditContent(note.content);
              }}
              className="bg-white/10 p-5 rounded-xl cursor-pointer"
            >
              <h3 className="text-xl font-semibold">{note.title || "Untitled"}</h3>
              {note.summary && <p className="text-slate-400">{note.summary}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {openNote && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-slate-900 p-6 rounded-xl w-full max-w-2xl">
            <textarea
              rows={10}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-white/5 p-4 rounded-lg"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setOpenNote(null)}>Cancel</button>
              <button onClick={handleUpdateContent} className="bg-violet-600 px-4 py-2 rounded-lg">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notes;
