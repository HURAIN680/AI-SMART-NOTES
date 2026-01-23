import { useEffect, useState } from "react";
import { Search, Plus, LogOut, Pin, Lock, Unlock, MoreVertical, Undo2, Redo2, Share2, Loader2, StickyNote } from "lucide-react";
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
      setOriginalOrder(res.data.map((note) => note._id));
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
        const updatedNotes = prevNotes.map((n) => (n._id === id ? res.data : n));
        const pinned = updatedNotes.filter(n => n.isPinned);
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

  // Share note
  const shareNote = (noteId) => {
    const link = `${window.location.origin}/share/${noteId}`;
    navigator.clipboard.writeText(link);
    alert(`Share link copied: ${link}`);
  };

  // Function to highlight matches inside preview only
  const getHighlightedContent = (text, word) => {
    if (!word.trim()) return text;
    const regex = new RegExp(`(${word})`, "gi");
    return text.replace(regex, '<mark class="bg-yellow-300">$1</mark>');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
              <StickyNote className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                My Notes
              </h1>
              <p className="text-sm text-gray-500 mt-1">Capture your thoughts</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200 shadow-sm flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes by title or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
          />
        </div>

        {/* New Note Button */}
        <button
          onClick={() => setShowCreateBox(!showCreateBox)}
          className="mb-8 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          New Note
        </button>

        {/* Create Note Box */}
        {/* Create Note Box */}
{showCreateBox && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white w-full h-full overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Create a Note</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleUndoCreate}
                  className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
                  title="Undo"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRedoCreate}
                  className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
                  title="Redo"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 flex flex-col flex-1">
              <input
                type="text"
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mb-4 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                
                className="w-full flex-1 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateNote}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md font-medium"
                >
                  Save Note
                </button>
                <button
                  onClick={() => setShowCreateBox(false)}
                  className="px-6 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
  </div>
        )}

        {/* Notes List */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="inline-block animate-spin w-12 h-12 text-blue-600" />
            <p className="text-gray-500 mt-4">Loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mb-4">
              <StickyNote className="w-12 h-12 text-blue-600" />
            </div>
            <p className="text-gray-500 text-lg font-medium">No notes yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first note to get started</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
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
                className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 cursor-pointer relative overflow-hidden group transition-all duration-300 hover:-translate-y-1"
              >
                {note.isPinned && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-orange-400"></div>
                )}
                
                <div className="p-5">
                  {/* Action buttons */}
                  <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePin(note._id);
                      }}
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-yellow-50 transition-all text-lg"
                      title={note.isPinned ? "Unpin Note" : "Pin Note"}
                    >
                      {note.isPinned ? "📌" : "📍"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLock(note);
                      }}
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-blue-50 transition-all text-lg"
                      title={note.isLocked ? "Unlock Note" : "Lock Note"}
                    >
                      {note.isLocked ? "🔒" : "🔓"}
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                      className="w-full text-lg font-semibold p-2 border border-blue-500 rounded-lg mb-2"
                    />
                  ) : (
                    <h3
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingNoteId(note._id);
                        setEditingTitle(note.title || "");
                      }}
                      className="text-lg font-bold text-gray-800 mb-2 hover:text-blue-600 transition-colors line-clamp-2"
                    >
                      {note.title || "Untitled"}
                    </h3>
                  )}

                  <div className={note.isLocked ? "blur-sm select-none" : ""}>
                    {note.summary && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                        {note.summary}
                      </p>
                    )}
                    {note.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {note.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
                            #{tag}
                          </span>
                        ))}
                        {note.tags.length > 3 && (
                          <span className="text-xs text-gray-400 px-2 py-1">
                            +{note.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note._id);
                    }}
                    className="text-sm text-red-500 hover:text-red-700 hover:underline transition-colors mt-2 flex items-center gap-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {openNote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full h-full overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white truncate pr-4 flex items-center gap-2">
                <StickyNote className="w-5 h-5" />
                {openNote.title || "Untitled"}
              </h2>
              <div className="flex gap-2 items-center flex-shrink-0">
                <button
                  type="button"
                  onClick={handleUndoEdit}
                  className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
                  title="Undo"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRedoEdit}
                  className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
                  title="Redo"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowOptions((prev) => !prev)}
                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all"
                    title="More options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {showOptions && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      <button
                        onClick={() => {
                          setShowFind(!showFind);
                          setShowOptions(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3"
                      >
                        <Search className="w-4 h-4 text-gray-600" />
                        <span className="text-sm">Find in note</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          shareNote(openNote._id);
                          setShowOptions(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3"
                      >
                        <Share2 className="w-4 h-4 text-gray-600" />
                        <span className="text-sm">Share</span>
                      </button>
                      {openNote.isLocked && (
                        <button
                          onClick={() => {
                            setPinInput("");
                            setPinError("");
                            setShowPinModal(true);
                            setShowOptions(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3"
                        >
                          <Unlock className="w-4 h-4 text-gray-600" />
                          <span className="text-sm">Unlock forever</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                {new Date(openNote.createdAt).toLocaleString()}
              </p>

              {showFind && (
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Type word to find..."
                    value={findWord}
                    onChange={(e) => setFindWord(e.target.value)}
                    className="border border-gray-300 pl-10 pr-4 py-2 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                className="w-full p-4 border border-gray-300 rounded-xl resize-none outline-none focus:ring-2 focus:ring-blue-500 transition-all h-[60vh]"
                style={{ lineHeight: "1.6" }}
              />

              {findWord.trim() && (
                <div
                  className="border border-gray-200 rounded-xl p-4 mt-4 max-h-[40vh] overflow-y-auto text-gray-800 whitespace-pre-wrap break-words bg-gray-50"
                  dangerouslySetInnerHTML={{
                    __html: getHighlightedContent(editContent, findWord),
                  }}
                />
              )}
            </div>

            <div className="p-6 pt-0 border-t border-gray-100">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setOpenNote(null)}
                  className="px-6 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateContent}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                {isSettingPin ? <Lock className="w-6 h-6 text-white" /> : <Unlock className="w-6 h-6 text-white" />}
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {isSettingPin ? "Set PIN" : "Enter PIN"}
              </h3>
            </div>

            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 rounded-xl mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Enter PIN"
            />

            {pinError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg mb-4">
                {pinError}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPinModal(false)}
                className="px-5 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>
              {isSettingPin ? (
                <button
                  onClick={handleSubmitPin}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md font-medium flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Set PIN
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSubmitPin}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md font-medium"
                  >
                    Open
                  </button>
                  {openNote && openNote.isLocked && (
                    <button
                      onClick={handlePermanentUnlock}
                      className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-md font-medium flex items-center gap-2"
                    >
                      <Unlock className="w-4 h-4" />
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