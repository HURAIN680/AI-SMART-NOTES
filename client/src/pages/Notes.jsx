import { useEffect, useState, } from "react";
import api from "../api/axios";

function Notes() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create note toggle
  const [showCreateBox, setShowCreateBox] = useState(false);

  // Inline title editing
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Edit modal
  const [openNote, setOpenNote] = useState(null);
  const [editContent, setEditContent] = useState("");

  // Undo/Redo stacks
  const [undoStackCreate, setUndoStackCreate] = useState([]);
  const [redoStackCreate, setRedoStackCreate] = useState([]);
  const [undoStackEdit, setUndoStackEdit] = useState([]);
  const [redoStackEdit, setRedoStackEdit] = useState([]);

  // Find words
  const [showFind, setShowFind] = useState(false);
  const [findWord, setFindWord] = useState("");

  // Options menu
  const [showOptions, setShowOptions] = useState(false);

  //in order to fetch notes from backend(pin)
  const [originalOrder, setOriginalOrder] = useState([]);

  
  // Lock states
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinNote, setPinNote] = useState(null);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [pinError, setPinError] = useState("");

  // Fetch notes
  const fetchNotes = async (searchText = "") => {
    try {
      const res = await api.get("/notes", { params: { search: searchText } });
      setOriginalOrder(res.data.map((note) => note._id)); // store original order
      setNotes(res.data.sort((a, b) => (b.isPinned === true) - (a.isPinned === true)));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchNotes(search), 300);
    return () => clearTimeout(delay);
  }, [search]);

  useEffect(() => {
  if (!openNote) {
    setShowOptions(false);
    setShowFind(false);
  }
}, [openNote]);


  // Create note
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
    } catch (error) {
      console.error(error);
    }
  };

  // Delete note
  const handleDeleteNote = async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      setNotes(notes.filter((note) => note._id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  // Update title
  const handleUpdateTitle = async (id) => {
    if (!editingTitle.trim()) {
      setEditingNoteId(null);
      return;
    }
    try {
      const res = await api.put(`/notes/${id}`, { title: editingTitle });
      setNotes(notes.map((n) => (n._id === id ? res.data : n)));
      setEditingNoteId(null);
      setEditingTitle("");
    } catch (error) {
      console.error(error);
    }
  };

  // Update content
  const handleUpdateContent = async () => {
    if (!editContent.trim()) return;
    try {
      const res = await api.put(`/notes/${openNote._id}`, { content: editContent });
      setNotes(notes.map((n) => (n._id === openNote._id ? res.data : n)));
      setOpenNote(null);
      setEditContent("");
      setShowFind(false);
      setFindWord("");
      setUndoStackEdit([]);
      setRedoStackEdit([]);
    } catch (error) {
      console.error(error);
    }
  };

  // Undo/Redo handlers for create
  const handleUndoCreate = () => {
    if (undoStackCreate.length === 0) return;
    const last = undoStackCreate[undoStackCreate.length - 1];
    setRedoStackCreate([content, ...redoStackCreate]);
    setContent(last);
    setUndoStackCreate(undoStackCreate.slice(0, -1));
  };

  const handleRedoCreate = () => {
    if (redoStackCreate.length === 0) return;
    const next = redoStackCreate[0];
    setUndoStackCreate([...undoStackCreate, content]);
    setContent(next);
    setRedoStackCreate(redoStackCreate.slice(1));
  };

  // Undo/Redo handlers for edit modal
  const handleUndoEdit = () => {
    if (undoStackEdit.length === 0) return;
    const last = undoStackEdit[undoStackEdit.length - 1];
    setRedoStackEdit([editContent, ...redoStackEdit]);
    setEditContent(last);
    setUndoStackEdit(undoStackEdit.slice(0, -1));
  };

  const handleRedoEdit = () => {
    if (redoStackEdit.length === 0) return;
    const next = redoStackEdit[0];
    setUndoStackEdit([...undoStackEdit, editContent]);
    setEditContent(next);
    setRedoStackEdit(redoStackEdit.slice(1));

  };

  // Toggle pin note
  const handleTogglePin = async (id) => {
  try {
    const res = await api.patch(`/notes/${id}/pin`);

    setNotes((prevNotes) => {
      // update the toggled note
      const updatedNotes = prevNotes.map((n) => (n._id === id ? res.data : n));

      // pinned notes on top
      const pinned = updatedNotes.filter(n => n.isPinned);

      // unpinned notes in original order
      const unpinned = originalOrder
        .map(nid => updatedNotes.find(n => n._id === nid))
        .filter(Boolean)
        .filter(n => !n.isPinned);

      return [...pinned, ...unpinned];
    });
  } catch (error) {
    console.error("Failed to toggle pin", error);
  }
};

// Toggle lock note
const handleToggleLock = (note) => {
  setPinNote(note);
  setIsSettingPin(!note.isLocked);
  setPinInput("");
  setPinError("");
  setShowPinModal(true);
};

// Submit PIN for setting or verifying
const handleSubmitPin = async () => {
  if (!pinInput.trim()) return;

  try {
    const endpoint = isSettingPin
      ? `/notes/${pinNote._id}/lock`
      : `/notes/${pinNote._id}/verify-pin`;

    const res = await api.patch(endpoint, { pin: pinInput });

    if (!isSettingPin) {
      // verified → open note
      setOpenNote(pinNote);
      setEditContent(pinNote.content);
    }

    setNotes((prev) =>
      prev.map((n) => (n._id === pinNote._id ? res.data : n))
    );

    setShowPinModal(false);
    setPinInput("");
  } catch (err) {
    setPinError("Incorrect PIN");
  }
};

// Unlock note permanently
const handlePermanentUnlock = async () => {
  if (!pinInput.trim()) return;

  try {
    const res = await api.patch(
      `/notes/${openNote._id}/unlock`,
      { pin: pinInput }
    );

    setNotes((prev) =>
      prev.map((n) => (n._id === openNote._id ? res.data : n))
    );

    setOpenNote(res.data);
    setPinInput("");
    setPinError("");
    setShowPinModal(false);
  } catch (err) {
    setPinError("Incorrect PIN");
  }
};

  // Function to highlight matches inside preview only
  const getHighlightedContent = (text, word) => {
    if (!word.trim()) return text;
    const regex = new RegExp(`(${word})`, "gi");
    return text.replace(regex, '<mark class="bg-yellow-300">$1</mark>');
  };

  return (
  <div className="min-h-screen bg-gray-100 p-6">
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Notes</h1>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
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

      {/* New Note */}
      <button
        onClick={() => setShowCreateBox(!showCreateBox)}
        className="mb-6 flex items-center gap-2 text-blue-600 font-medium hover:underline"
      >
        <span className="text-xl">+</span> New Note
      </button>

      {/* Create Note Box */}
      {showCreateBox && (
        <form
          onSubmit={handleCreateNote}
          className="bg-white p-5 rounded-lg shadow mb-8 relative"
        >
          <h2 className="text-lg font-semibold mb-4">Create a Note</h2>

          {/* Undo/Redo buttons */}
          <div className="absolute top-5 right-5 flex gap-2">
            <button
              type="button"
              onClick={handleUndoCreate}
              className="px-3 py-1 hover:bg-gray-200 rounded"
            >
              ↩️
            </button>
            <button
              type="button"
              onClick={handleRedoCreate}
              className="px-3 py-1 hover:bg-gray-200 rounded"
            >
              ↪️
            </button>
          </div>

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
              onChange={(e) => {
                const newValue = e.target.value;
                if (newValue !== content) {
                  setUndoStackCreate([...undoStackCreate, content]);
                  setContent(newValue);
                  setRedoStackCreate([]);
                }
              }}
              rows={6}
              className="w-full p-2 border rounded resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              if (note.isLocked) {
                    setPinNote(note);
                    setIsSettingPin(false);
                    setShowPinModal(true);
                    return;
                  }

                  setOpenNote(note);
                  setEditContent(note.content);
                  setUndoStackEdit([]);
                  setRedoStackEdit([]);
                  setShowFind(false);
                  setFindWord("");
            }}
           className="bg-white p-5 rounded-lg shadow mb-4 cursor-pointer relative hover:bg-gray-50"

          >
            {/* Pin button at top-right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePin(note._id); // call your backend toggle pin
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-yellow-500"
              title={note.isPinned ? "Unpin Note" : "Pin Note"}
            >
              {note.isPinned ? "📌" : "📍"}
            </button>
    
            {/* Lock button next to pin */}
            <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleLock(note);
                }}
                className="absolute top-3 right-12 text-gray-400 hover:text-blue-600"
                title={note.isLocked ? "Unlock Note" : "Lock Note"}
              >
                {note.isLocked ? "🔒" : "🔓"}
            </button>

          
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
                <p className="text-xs text-gray-400 mb-2">Click title to edit</p>
              </>
            )}
            <div className={note.isLocked ? "blur-sm select-none" : ""}>
            {note.summary && <p className="text-sm text-gray-700 mb-3">{note.summary}</p>}
            {note.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {note.tags.map((tag, i) => (
                  <span key={i} className="text-xs bg-gray-200 px-2 py-1 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            </div>
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

    {/* Edit Modal */}
    {openNote && (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white w-full max-w-lg rounded-lg p-6 shadow-lg relative">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">{openNote.title || "Untitled"}</h2>
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={handleUndoEdit}
                className="px-3 py-1 hover:bg-gray-200 rounded"
              >
                ↩️
              </button>
              <button
                type="button"
                onClick={handleRedoEdit}
                className="px-3 py-1 hover:bg-gray-200 rounded"
              >
                ↪️
              </button>
            </div>
            <div className="relative ml-2">
  <button
    onClick={() => setShowOptions((prev) => !prev)}
    className="text-xl px-2 hover:bg-gray-200 rounded"
    title="More options"
  >
    ⋮
  </button>

  {showOptions && (
    <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-md z-50">
      <button
        onClick={() => {
          setShowFind(!showFind);
          setShowOptions(false);
        }}
        className="w-full text-left px-4 py-2 hover:bg-gray-100"
      >
        🔍 Find in note
      </button>
     
      {openNote.isLocked && (
        <button
          onClick={() => {
            setPinInput("");
            setPinError("");
            setShowPinModal(true);
            setShowOptions(false);
          }}
          className="w-full text-left px-4 py-2 hover:bg-gray-100"
        >
          🔓 Unlock forever
        </button>
      )}
    </div>
  )}
</div>

          </div>

          <p className="text-xs text-gray-500 mb-3">
            {new Date(openNote.createdAt).toLocaleString()}
          </p>

          {showFind && (
            <input
              type="text"
              placeholder="Type word to find..."
              value={findWord}
              onChange={(e) => setFindWord(e.target.value)}
              className="border px-2 py-1 rounded w-full mb-2"
            />
          )}

          {/* Single flexible textarea for editing */}
          <textarea
            value={editContent}
            onChange={(e) => {
              const newValue = e.target.value;
              if (newValue !== editContent) {
                setUndoStackEdit([...undoStackEdit, editContent]);
                setEditContent(newValue);
                setRedoStackEdit([]);
              }
            }}
            rows={10}
            className="w-full p-3 border rounded resize-y outline-none"
            style={{ maxHeight: "60vh", minHeight: "150px", lineHeight: "1.5", fontFamily: "inherit" }}
          />

          {/* Live preview with highlights */}
          {findWord.trim() && (
            <div
              className="border rounded p-2 mt-2 max-h-[40vh] overflow-y-auto text-gray-800 whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{
                __html: getHighlightedContent(editContent, findWord),
              }}
            />
          )}

          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setOpenNote(null)} className="px-4 py-2 border rounded">
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
    {showPinModal && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-80">
      <h3 className="text-lg font-semibold mb-3">
        {isSettingPin ? "Set PIN" : "Enter PIN"}
      </h3>

      <input
        type="password"
        value={pinInput}
        onChange={(e) => setPinInput(e.target.value)}
        className="w-full border p-2 rounded mb-2"
        placeholder="Enter PIN"
      />

      {pinError && <p className="text-red-500 text-sm">{pinError}</p>}

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => setShowPinModal(false)}
          className="px-4 py-2 border rounded"
        >
          Cancel
        </button>
        {isSettingPin ? (
  <button
    onClick={handleSubmitPin}
    className="px-4 py-2 bg-blue-600 text-white rounded"
  >
    Set PIN
  </button>
) : (
  <>
    <button
      onClick={handleSubmitPin}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      Open
    </button>

    {openNote && openNote.isLocked && (
      <button
        onClick={handlePermanentUnlock}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Unlock Forever
      </button>
    )}
  </>
)}

      </div>
    </div>
  </div>
)}

  </div>
);
};
 export default Notes;