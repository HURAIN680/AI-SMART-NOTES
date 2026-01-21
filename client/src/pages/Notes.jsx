import { useEffect, useState } from "react";
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

  // --- FILE UPLOAD STATE (Renamed to match your snippet) ---
  const [uploading, setUploading] = useState(false); 

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

  // Original order for pinning logic
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
      setOriginalOrder(res.data.map((note) => note._id));
      setNotes(
        res.data.sort((a, b) => (b.isPinned === true) - (a.isPinned === true))
      );
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
      const res = await api.put(`/notes/${openNote._id}`, {
        content: editContent,
      });
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

  // --- UPDATED: Handle File Upload (Immediate) ---
  const handleFileUpload = async (file, noteId) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true); // Start spinner

      const res = await api.post(
        `/notes/${noteId}/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Update State
      setOpenNote(res.data); 
      setNotes(notes.map((n) => (n._id === noteId ? res.data : n))); 

    } catch (error) {
      console.error("File upload failed", error);
      alert("Upload failed.");
    } finally {
      setUploading(false); // Stop spinner
    }
  };

  // Undo/Redo logic...
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

  // Pin logic
  const handleTogglePin = async (id) => {
    try {
      const res = await api.patch(`/notes/${id}/pin`);
      setNotes((prevNotes) => {
        const updatedNotes = prevNotes.map((n) =>
          n._id === id ? res.data : n
        );
        const pinned = updatedNotes.filter((n) => n.isPinned);
        const unpinned = originalOrder
          .map((nid) => updatedNotes.find((n) => n._id === nid))
          .filter(Boolean)
          .filter((n) => !n.isPinned);
        return [...pinned, ...unpinned];
      });
    } catch (error) {
      console.error("Failed to toggle pin", error);
    }
  };

  const handleToggleLock = (note) => {
    setPinNote(note);
    setIsSettingPin(!note.isLocked);
    setPinInput("");
    setPinError("");
    setShowPinModal(true);
  };

  const handleSubmitPin = async () => {
    if (!pinInput.trim()) return;
    try {
      const endpoint = isSettingPin
        ? `/notes/${pinNote._id}/lock`
        : `/notes/${pinNote._id}/verify-pin`;
      const res = await api.patch(endpoint, { pin: pinInput });

      if (!isSettingPin) {
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

  const handlePermanentUnlock = async () => {
    if (!pinInput.trim()) return;
    try {
      const res = await api.patch(`/notes/${openNote._id}/unlock`, {
        pin: pinInput,
      });
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
<<<<<<< HEAD
            className="text-red-600 hover:underline"
=======
           className="bg-white p-5 rounded-lg shadow mb-4 cursor-pointer relative hover:bg-gray-50"

>>>>>>> ee699d6aff415d817138d04677f5e23fad2e94d8
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
            {/* Undo/Redo */}
            <div className="absolute top-5 right-5 flex gap-2">
              <button type="button" onClick={handleUndoCreate} className="px-3 py-1 hover:bg-gray-200 rounded">
                ↩️
              </button>
              <button type="button" onClick={handleRedoCreate} className="px-3 py-1 hover:bg-gray-200 rounded">
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
              <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700">
                Save Note
              </button>
              <button type="button" onClick={() => setShowCreateBox(false)} className="px-5 py-2 border rounded">
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
              className="bg-white p-5 rounded-lg shadow mb-4 cursor-pointer hover:bg-gray-50 relative"
            >
              {/* Note actions (Pin/Lock) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTogglePin(note._id);
                }}
                className="absolute top-3 right-3 text-gray-400 hover:text-yellow-500"
              >
                {note.isPinned ? "📌" : "📍"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleLock(note);
                }}
                className="absolute top-3 right-12 text-gray-400 hover:text-blue-600"
              >
                {note.isLocked ? "🔒" : "🔓"}
<<<<<<< HEAD
=======
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
>>>>>>> ee699d6aff415d817138d04677f5e23fad2e94d8
              </button>

              <p className="text-xs text-gray-500 mb-1">
                {new Date(note.createdAt).toLocaleString()}
              </p>
              
              {/* Note Title */}
              {editingNoteId === note._id ? (
                <input
                  value={editingTitle}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
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
              {note.summary && <p className="text-sm text-gray-700 mb-3">{note.summary}</p>}
              
              {/* Files Indicator */}
              {note.files && note.files.length > 0 && (
                 <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    📎 {note.files.length} attachment{note.files.length !== 1 && 's'}
                 </div>
              )}

              {note.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 mt-2">
                  {note.tags.map((tag, i) => (
                    <span key={i} className="text-xs bg-gray-200 px-2 py-1 rounded">
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

      {/* Edit Modal */}
      {openNote && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-lg p-6 shadow-lg relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">
                {openNote.title || "Untitled"}
              </h2>
              {/* Undo/Redo in Modal */}
              <div className="flex gap-2 ml-auto">
                <button type="button" onClick={handleUndoEdit} className="px-3 py-1 hover:bg-gray-200 rounded">
                  ↩️
                </button>
                <button type="button" onClick={handleRedoEdit} className="px-3 py-1 hover:bg-gray-200 rounded">
                  ↪️
                </button>
              </div>
              {/* Options */}
              <div className="relative ml-2">
                <button
                  onClick={() => setShowOptions((prev) => !prev)}
                  className="text-xl px-2 hover:bg-gray-200 rounded"
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
              style={{
                minHeight: "150px",
                lineHeight: "1.5",
                fontFamily: "inherit",
              }}
            />

            {findWord.trim() && (
              <div
                className="border rounded p-2 mt-2 max-h-[40vh] overflow-y-auto text-gray-800 whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{
                  __html: getHighlightedContent(editContent, findWord),
                }}
              />
            )}
            
            {/* --- REPLACED: Attachments Section (Violet UI) --- */}
            <div className="mt-4 border-t pt-4">
              <h4 className="font-semibold mb-2">Attachments</h4>
              
              {/* List Existing Files */}
              <div className="flex flex-wrap gap-4 mb-4">
                {openNote.files && openNote.files.map((file) => (
                  <div key={file._id} className="border p-2 rounded w-24 text-center overflow-hidden">
                     {file.type && file.type.startsWith('image/') ? (
                         <img src={file.url} alt="attachment" className="w-full h-16 object-cover mb-1 rounded" />
                     ) : (
                         <div className="text-3xl mb-1">📄</div>
                     )}
                     <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block truncate">
                        {file.originalName || "File"}
                     </a>
                  </div>
                ))}
              </div>

              {/* Styled File Input (Violet) */}
              <div className="mb-4">
                <label className="text-sm text-slate-400 mb-1 block">
                  Attach File
                </label>

                <input
                  type="file"
                  onChange={(e) =>
                    handleFileUpload(e.target.files[0], openNote._id)
                  }
                  className="block w-full text-sm text-slate-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:bg-violet-600 file:text-white
                    hover:file:bg-violet-700"
                />

                {uploading && (
                  <p className="text-xs text-slate-400 mt-1">
                    Uploading file...
                  </p>
                )}
              </div>
            </div>
            {/* --------------------------- */}

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

      {/* Pin Modal */}
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
}

export default Notes;