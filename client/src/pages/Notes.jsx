import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  Plus,
  Search,
  LogOut,
  Trash2,
  Tag,
} from "lucide-react";

function Notes() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [openNote, setOpenNote] = useState(null);
  const [editContent, setEditContent] = useState("");

  /* ---------------- FETCH NOTES ---------------- */
  const fetchNotes = async (query = "") => {
    try {
      setLoading(true);
      const res = await api.get("/notes", {
        params: { search: query },
      });
      setNotes(res.data);
    } catch (err) {
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

    const tags = tagsInput
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    try {
      const res = await api.post("/notes", {
        title,
        content,
        tags,
      });

      setNotes([res.data, ...notes]);
      setTitle("");
      setContent("");
      setTagsInput("");
      setShowCreate(false);
    } catch {
      console.error("Create failed");
    }
  };

  /* ---------------- DELETE NOTE ---------------- */
  const handleDeleteNote = async (id) => {
    try {
      await api.put(`/notes/${id}`, { isDeleted: true });
      setNotes(notes.filter(n => n._id !== id));
    } catch {
      console.error("Delete failed");
    }
  };

  /* ---------------- UPDATE CONTENT ---------------- */
  const handleUpdateContent = async () => {
    try {
      const res = await api.put(`/notes/${openNote._id}`, {
        content: editContent,
      });

      setNotes(notes.map(n =>
        n._id === openNote._id ? res.data : n
      ));
      setOpenNote(null);
    } catch {
      console.error("Update failed");
    }
  };

  /* ---------------- LOGOUT ---------------- */
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">My Notes</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-400"
        >
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
        onClick={() => setShowCreate(!showCreate)}
        className="mb-6 flex items-center gap-2 bg-violet-600 px-6 py-3 rounded-xl"
      >
        <Plus /> New Note
      </button>

      {/* Create Note */}
      {showCreate && (
        <form
          onSubmit={handleCreateNote}
          className="bg-white/10 p-6 rounded-xl mb-6"
        >
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-3 px-4 py-2 bg-white/5 rounded-lg"
          />

          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note..."
            className="w-full mb-3 px-4 py-2 bg-white/5 rounded-lg"
          />

          <input
            placeholder="Tags (comma separated)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full mb-4 px-4 py-2 bg-white/5 rounded-lg"
          />

          <div className="flex gap-3">
            <button className="bg-violet-600 px-4 py-2 rounded-lg">
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Notes List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4">
          {notes.map(note => (
            <div
              key={note._id}
              className="bg-white/10 p-5 rounded-xl"
            >
              {/* Title + Delete */}
              <div className="flex justify-between items-start mb-2">
                <h3
                  onClick={() => {
                    setOpenNote(note);
                    setEditContent(note.content);
                  }}
                  className="text-xl font-semibold cursor-pointer hover:text-violet-300 transition"
                >
                  {note.title || "Untitled"}
                </h3>

                <button
                  onClick={() => handleDeleteNote(note._id)}
                  className="text-red-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* SUMMARY */}
              {note.summary && (
                <p className="text-slate-300 text-sm mb-3 line-clamp-2">
                  {note.summary}
                </p>
              )}

              {/* TAGS */}
              {note.tags?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {note.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs bg-violet-500/20 border border-violet-500/30 text-violet-300 px-3 py-1 rounded-full flex items-center gap-1"
                    >
                      <Tag size={12} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
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
              <button
                onClick={handleUpdateContent}
                className="bg-violet-600 px-4 py-2 rounded-lg"
              >
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
