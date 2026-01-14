import { useEffect, useState } from "react";
import api from "../api/axios";

function Notes() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Toggle create box
  const [showCreateBox, setShowCreateBox] = useState(false);

  // Inline title editing
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Read & Update modal
  const [openNote, setOpenNote] = useState(null);
  const [editContent, setEditContent] = useState("");

  // Fetch notes
  const fetchNotes = async (searchText = "") => {
    try {
      const res = await api.get("/notes", {
        params: { search: searchText },
      });
      setNotes(res.data);
    } catch (error) {
      console.error("Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchNotes(search);
    }, 300);

    return () => clearTimeout(delay);
  }, [search]);

  // Create note
  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const res = await api.post("/notes", { title, content });
      setNotes([res.data, ...notes]);
      setTitle("");
      setContent("");
      setShowCreateBox(false); // close after save
    } catch (error) {
      console.error("Failed to create note");
    }
  };

  // Delete note
  const handleDeleteNote = async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      setNotes(notes.filter((note) => note._id !== id));
    } catch (error) {
      console.error("Failed to delete note");
    }
  };

  // Update title
  const handleUpdateTitle = async (id) => {
    if (!editingTitle.trim()) {
      setEditingNoteId(null);
      return;
    }

    try {
      const res = await api.put(`/notes/${id}`, {
        title: editingTitle,
      });

      setNotes(notes.map((n) => (n._id === id ? res.data : n)));
      setEditingNoteId(null);
      setEditingTitle("");
    } catch (error) {
      console.error("Failed to update title");
    }
  };

  // Update content
  const handleUpdateContent = async () => {
    if (!editContent.trim()) return;

    try {
      const res = await api.put(`/notes/${openNote._id}`, {
        content: editContent,
      });

      setNotes(
        notes.map((note) =>
          note._id === openNote._id ? res.data : note
        )
      );

      setOpenNote(null);
      setEditContent("");
    } catch (error) {
      console.error("Failed to update content");
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Notes</h1>
          <button
            onClick={handleLogout}
            className="text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search notes by title or content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* + New Note Button */}
        <button
          onClick={() => setShowCreateBox(!showCreateBox)}
          className="mb-6 flex items-center gap-2 text-blue-600 font-medium hover:underline"
        >
          <span className="text-xl">+</span>
          New Note
        </button>

        {/* Create Note Box */}
        {showCreateBox && (
          <form
            onSubmit={handleCreateNote}
            className="bg-white p-5 rounded-lg shadow mb-8"
          >
            <h2 className="text-lg font-semibold mb-4">Create a Note</h2>

            <div className="border rounded-lg p-4 bg-gray-50">
              <input
                type="text"
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mb-3 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <textarea
                placeholder="Write your note here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows="4"
                className="w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
              >
                Save Note
              </button>
              <button
                type="button"
                onClick={() => setShowCreateBox(false)}
                className="px-5 py-2 border rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Notes List */}
        {loading ? (
          <p className="text-center text-gray-500">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-center text-gray-500">No notes yet</p>
        ) : (
          notes.map((note) => (
            <div
              key={note._id}
              onClick={() => {
                setOpenNote(note);
                setEditContent(note.content);
              }}
              className="bg-white p-5 rounded-lg shadow mb-4 cursor-pointer hover:bg-gray-50"
            >
              <p className="text-xs text-gray-500 mb-1">
                {new Date(note.createdAt).toLocaleString()}
              </p>

              {editingNoteId === note._id ? (
                <input
                  value={editingTitle}
                  autoFocus
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => handleUpdateTitle(note._id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdateTitle(note._id);
                  }}
                  className="w-full text-lg font-semibold p-1 border rounded"
                />
              ) : (
                <>
                  <h3
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingNoteId(note._id);
                      setEditingTitle(note.title || "");
                    }}
                    className="text-lg font-semibold hover:text-blue-600"
                  >
                    {note.title || "Untitled"}
                  </h3>
                  <p className="text-xs text-gray-400 mb-2">
                    Click title to edit
                  </p>
                </>
              )}

              {note.summary && (
                <p className="text-sm text-gray-700 mb-3">
                  {note.summary}
                </p>
              )}

              {note.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {note.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs bg-gray-200 px-2 py-1 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteNote(note._id);
                }}
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {openNote && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-lg p-6 shadow-lg">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {openNote.title || "Untitled"}
              </h2>
              <button onClick={() => setOpenNote(null)}>✕</button>
            </div>

            <p className="text-xs text-gray-500 mb-3">
              {new Date(openNote.createdAt).toLocaleString()}
            </p>

            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows="6"
              className="w-full p-3 border rounded resize-none"
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setOpenNote(null)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateContent}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notes;