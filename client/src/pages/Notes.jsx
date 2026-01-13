import { useEffect, useState } from "react";
import api from "../api/axios";
import NoteCard from "../components/NoteCard";

function Notes() {
  const [notes, setNotes] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch notes
  const fetchNotes = async () => {
    try {
      const res = await api.get("/notes");
      setNotes(res.data);
    } catch (error) {
      console.error("Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Create note
  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const res = await api.post("/notes", { content });
      setNotes([res.data, ...notes]);
      setContent("");
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

  const handleUpdateNote = async (id, newContent) => {
  try {
    const res = await api.put(`/notes/${id}`, {
      content: newContent,
    });

    setNotes(
      notes.map((note) =>
        note._id === id ? res.data : note
      )
    );
  } catch (error) {
    console.error("Failed to update note");
  }
};

{notes.map((note) => (
  <NoteCard
    key={note._id}
    note={note}
    onDelete={handleDeleteNote}
    onUpdate={handleUpdateNote}
  />
))}

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        
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

        {/* Create Note */}
        <form
          onSubmit={handleCreateNote}
          className="bg-white p-4 rounded-lg shadow mb-6"
        >
          <textarea
            className="w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            placeholder="Write your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <button
            type="submit"
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Note
          </button>
        </form>

        {/* Notes List */}
        {loading ? (
          <p className="text-center text-gray-500">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-center text-gray-500">No notes yet</p>
        ) : (
          notes.map((note) => (
            <div
              key={note._id}
              className="bg-white p-4 rounded-lg shadow mb-4"
            >
              <h3 className="font-semibold text-lg mb-1">
                {note.title || "Untitled"}
              </h3>

              <p className="text-gray-700 mb-2">{note.content}</p>

              {note.summary && (
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Summary:</strong> {note.summary}
                </p>
              )}

              {note.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {note.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs bg-gray-200 px-2 py-1 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleDeleteNote(note._id)}
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notes;