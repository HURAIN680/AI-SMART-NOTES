import { useEffect, useState, useRef } from "react";
import { 
  Search, Plus, LogOut, Pin, Lock, Unlock, MoreVertical, 
  Undo2, Redo2, Share2, Loader2, StickyNote, X, 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Palette
} from "lucide-react";
import api from "../api/axios";
import DOMPurify from "dompurify";

function Notes() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Toolbar toggles
  const [showCreateToolbar, setShowCreateToolbar] = useState(true); // Default to true for better UX
  const [showEditToolbar, setShowEditToolbar] = useState(true);

  const createEditorRef = useRef(null);
  const editEditorRef = useRef(null);

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

  // Order state
  const [originalOrder, setOriginalOrder] = useState([]);

  // Lock/Pin states
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinNote, setPinNote] = useState(null);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [pinError, setPinError] = useState("");

  // --- API CALLS ---
  const fetchNotes = async (searchText = "") => {
    try {
      const res = await api.get("/notes", { params: { search: searchText } });
      setOriginalOrder(res.data.map((note) => note._id));
      // Sort pinned to top
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

  useEffect(() => {
    if (openNote && editEditorRef.current) {
      editEditorRef.current.innerHTML = openNote.content || "";
    }
  }, [openNote]);

  // --- HANDLERS ---
  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!content.trim() && !title.trim()) return; // Don't save empty
    try {
      const res = await api.post("/notes", { title, content });
      setNotes([res.data, ...notes]);
      setTitle("");
      setContent("");
      if(createEditorRef.current) createEditorRef.current.innerHTML = "";
      setUndoStackCreate([]);
      setRedoStackCreate([]);
      setShowCreateBox(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteNote = async (id) => {
    if(!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await api.delete(`/notes/${id}`);
      setNotes(notes.filter((note) => note._id !== id));
    } catch (error) {
      console.error(error);
    }
  };

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

  const handleUpdateContent = async () => {
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

  // --- UNDO/REDO LOGIC ---
  function placeCaretAtEnd(el) {
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  const handleUndoCreate = () => {
    if (undoStackCreate.length === 0) return;
    const last = undoStackCreate[undoStackCreate.length - 1];
    setRedoStackCreate((prev) => [content, ...prev]);
    setUndoStackCreate((prev) => prev.slice(0, -1));
    setContent(last);
    if (createEditorRef.current) {
      createEditorRef.current.innerHTML = last;
      placeCaretAtEnd(createEditorRef.current);
    }
  };

  const handleRedoCreate = () => {
    if (redoStackCreate.length === 0) return;
    const next = redoStackCreate[0];
    setUndoStackCreate((prev) => [...prev, content]);
    setRedoStackCreate((prev) => prev.slice(1));
    setContent(next);
    if (createEditorRef.current) {
      createEditorRef.current.innerHTML = next;
      placeCaretAtEnd(createEditorRef.current);
    }
  };

  const handleUndoEdit = () => {
    if (undoStackEdit.length === 0) return;
    const last = undoStackEdit[undoStackEdit.length - 1];
    setRedoStackEdit((prev) => [editContent, ...prev]);
    setUndoStackEdit((prev) => prev.slice(0, -1));
    setEditContent(last);
    if (editEditorRef.current) {
      editEditorRef.current.innerHTML = last;
      placeCaretAtEnd(editEditorRef.current);
    }
  };

  const handleRedoEdit = () => {
    if (redoStackEdit.length === 0) return;
    const next = redoStackEdit[0];
    setUndoStackEdit((prev) => [...prev, editContent]);
    setRedoStackEdit((prev) => prev.slice(1));
    setEditContent(next);
    if (editEditorRef.current) {
      editEditorRef.current.innerHTML = next;
      placeCaretAtEnd(editEditorRef.current);
    }
  };

  // --- PIN/LOCK LOGIC ---
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
        // Correct pin entered, open note
        setOpenNote(pinNote);
        setEditContent(pinNote.content);
      }
      
      // Update local state
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
      const res = await api.patch(`/notes/${openNote._id}/unlock`, { pin: pinInput });
      setNotes((prev) => prev.map((n) => (n._id === openNote._id ? res.data : n)));
      setOpenNote(res.data);
      setPinInput("");
      setPinError("");
      setShowPinModal(false);
    } catch (err) {
      setPinError("Incorrect PIN");
    }
  };

  // --- UTILS ---
  const shareNote = (noteId) => {
    const link = `${window.location.origin}/share/${noteId}`;
    navigator.clipboard.writeText(link);
    alert(`Share link copied: ${link}`);
  };

  const format = (command, value = null, type = "create") => {
    const ref = type === "edit" ? editEditorRef : createEditorRef;
    const editor = ref.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, value);
  };

  const getHighlightedContent = (html, word) => {
    if (!word.trim()) return DOMPurify.sanitize(html);
    const cleanHtml = DOMPurify.sanitize(html);
    const regex = new RegExp(`(${word})`, "gi");
    return cleanHtml.replace(regex, '<mark class="bg-yellow-300 rounded-sm">$1</mark>');
  };

  // --- COMPONENTS ---
  
  // Reusable Toolbar Component to keep things clean
  const EditorToolbar = ({ type }) => (
    <div className="flex flex-wrap items-center gap-1 mb-3 p-2 bg-gray-50 border border-gray-200 rounded-xl">
      <div className="flex gap-0.5 border-r border-gray-300 pr-2 mr-1">
        <button className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" onClick={() => format("bold", null, type)} title="Bold"><Bold size={16}/></button>
        <button className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" onClick={() => format("italic", null, type)} title="Italic"><Italic size={16}/></button>
        <button className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" onClick={() => format("underline", null, type)} title="Underline"><Underline size={16}/></button>
      </div>

      <div className="flex gap-0.5 border-r border-gray-300 pr-2 mr-1">
        <button className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" onClick={() => format("justifyLeft", null, type)} title="Align Left"><AlignLeft size={16}/></button>
        <button className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" onClick={() => format("justifyCenter", null, type)} title="Align Center"><AlignCenter size={16}/></button>
        <button className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" onClick={() => format("justifyRight", null, type)} title="Align Right"><AlignRight size={16}/></button>
      </div>

      <div className="flex items-center gap-2">
         <select 
          onChange={(e) => format("fontSize", e.target.value, type)}
          className="bg-transparent text-sm text-gray-700 font-medium focus:outline-none cursor-pointer"
        >
          <option value="3">Normal</option>
          <option value="1">Small</option>
          <option value="5">Large</option>
          <option value="7">Huge</option>
        </select>
        
        <div className="relative group flex items-center">
            <Palette size={16} className="text-gray-500 absolute left-1 pointer-events-none"/>
            <input 
              type="color" 
              className="opacity-0 w-8 h-8 cursor-pointer absolute"
              onChange={(e) => format("foreColor", e.target.value, type)} 
            />
            <div className="w-6 h-6 rounded-full border border-gray-300 bg-gradient-to-br from-red-400 to-blue-400 ml-1"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
              <StickyNote className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                My Notes
              </h1>
              <p className="text-sm text-slate-500 font-medium">Capture ideas, keep them safe.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateBox(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-semibold shadow-md shadow-blue-200 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">New Note</span>
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
              className="p-2.5 bg-white text-slate-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-xl transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* --- SEARCH BAR --- */}
        <div className="relative max-w-2xl mx-auto mb-10 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search your notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-sm transition-all duration-200"
          />
        </div>

        {/* --- CREATE MODAL --- */}
        {showCreateBox && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowCreateBox(false)} />
            
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-800">Create New Note</h2>
                <div className="flex gap-2">
                   <button onClick={handleUndoCreate} className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors" title="Undo"><Undo2 size={18}/></button>
                   <button onClick={handleRedoCreate} className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors" title="Redo"><Redo2 size={18}/></button>
                   <button onClick={() => setShowCreateBox(false)} className="p-2 hover:bg-red-100 hover:text-red-600 rounded-lg text-gray-400 transition-colors"><X size={20}/></button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                <input
                  type="text"
                  placeholder="Note Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-2xl font-bold text-gray-800 placeholder-gray-300 border-none outline-none bg-transparent mb-4"
                />
                
                {showCreateToolbar && <EditorToolbar type="create" />}

                <div
                  ref={createEditorRef}
                  contentEditable
                  className="flex-1 w-full outline-none text-gray-600 text-lg leading-relaxed whitespace-pre-wrap empty:before:content-[attr(placeholder)] empty:before:text-gray-300"
                  placeholder="Start typing your thoughts..."
                  suppressContentEditableWarning={true}
                  onInput={(e) => {
                    const html = e.currentTarget.innerHTML;
                    setUndoStackCreate([...undoStackCreate, content]);
                    setContent(html);
                    setRedoStackCreate([]);
                  }}
                ></div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateBox(false)}
                  className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNote}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md shadow-blue-200 transition-all"
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- NOTES GRID (MASONRY) --- */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin w-10 h-10 text-blue-500 mb-4" />
            <p className="text-gray-400 font-medium">Loading your thoughts...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
             <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <StickyNote className="w-10 h-10 text-gray-300" />
             </div>
             <h3 className="text-xl font-bold text-gray-800 mb-2">No notes yet</h3>
             <p className="text-gray-500 max-w-sm mx-auto mb-8">
               Your mind is clear! Tap the button below to capture your first idea.
             </p>
             <button
              onClick={() => setShowCreateBox(true)}
              className="text-blue-600 font-semibold hover:underline"
            >
              Create a note now &rarr;
            </button>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 pb-20">
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
                className={`
                  break-inside-avoid relative group bg-white rounded-2xl border border-gray-200/60
                  hover:border-blue-300/50 hover:shadow-xl hover:shadow-blue-100/50 
                  transition-all duration-300 ease-in-out cursor-pointer hover:-translate-y-1
                  overflow-hidden
                  ${note.isPinned ? 'ring-2 ring-orange-100 bg-orange-50/10' : 'shadow-sm'}
                `}
              >
                {/* Pinned Indicator */}
                {note.isPinned && (
                  <div className="absolute top-3 left-3 z-10">
                    <Pin className="w-4 h-4 text-orange-400 fill-orange-400 rotate-45" />
                  </div>
                )}
                
                {/* Lock Overlay */}
                {note.isLocked && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-gray-400" />
                  </div>
                )}

                <div className="p-5">
                   {/* Hover Actions (Absolute Top Right) */}
                   <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
                     <button
                        onClick={(e) => { e.stopPropagation(); handleTogglePin(note._id); }}
                        className={`p-1.5 rounded-lg backdrop-blur-sm shadow-sm border border-gray-100 transition-colors ${note.isPinned ? 'bg-orange-100 text-orange-600' : 'bg-white/90 text-gray-500 hover:bg-blue-50 hover:text-blue-600'}`}
                        title={note.isPinned ? "Unpin" : "Pin"}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleLock(note); }}
                        className={`p-1.5 rounded-lg backdrop-blur-sm shadow-sm border border-gray-100 transition-colors ${note.isLocked ? 'bg-red-100 text-red-600' : 'bg-white/90 text-gray-500 hover:bg-blue-50 hover:text-blue-600'}`}
                      >
                        {note.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteNote(note._id); }}
                        className="p-1.5 bg-white/90 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 backdrop-blur-sm shadow-sm border border-gray-100 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                   </div>

                  {/* Note Content Preview */}
                  <div className={note.isLocked ? "blur-sm select-none opacity-50" : ""}>
                    {editingNoteId === note._id ? (
                      <input
                        value={editingTitle}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleUpdateTitle(note._id)}
                        onKeyDown={(e) => e.key === "Enter" && handleUpdateTitle(note._id)}
                        className="w-full text-lg font-bold p-1 -ml-1 border-b-2 border-blue-500 bg-transparent focus:outline-none"
                      />
                    ) : (
                       <h3 
                        className={`text-lg font-bold text-gray-800 mb-2 leading-tight ${!note.title && 'text-gray-400 italic'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if(!note.isLocked) {
                             setEditingNoteId(note._id);
                             setEditingTitle(note.title || "");
                          }
                        }}
                       >
                         {note.title || "Untitled Note"}
                       </h3>
                    )}
                    
                    <p className="text-gray-600 text-sm line-clamp-4 leading-relaxed whitespace-pre-line min-h-[1.5rem]">
                      {note.summary || note.content?.replace(/<[^>]*>?/gm, '').substring(0, 100) || "No content"}
                    </p>
                    
                    <div className="mt-4 flex items-center justify-between">
                       <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                         {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- EDIT MODAL --- */}
      {openNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setOpenNote(null)} />
           
           <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             
             {/* Header */}
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
                <div className="flex-1 mr-4">
                  <h2 className="text-xl font-bold text-gray-800 truncate">{openNote.title || "Untitled"}</h2>
                  <p className="text-xs text-gray-400">
                    Last edited {new Date(openNote.updatedAt || openNote.createdAt).toLocaleString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                   <button onClick={handleUndoEdit} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Undo2 size={18}/></button>
                   <button onClick={handleRedoEdit} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Redo2 size={18}/></button>
                   
                   {/* Options Dropdown */}
                   <div className="relative">
                      <button 
                        onClick={() => setShowOptions(!showOptions)}
                        className={`p-2 rounded-lg text-gray-500 transition-colors ${showOptions ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {showOptions && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                          <button onClick={() => { setShowFind(!showFind); setShowOptions(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                             <Search size={16} /> Find in note
                          </button>
                          <button onClick={() => { shareNote(openNote._id); setShowOptions(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                             <Share2 size={16} /> Share note
                          </button>
                          {openNote.isLocked && (
                             <button onClick={() => { setPinInput(""); setPinError(""); setShowPinModal(true); setShowOptions(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                                <Unlock size={16} /> Unlock Permanently
                             </button>
                          )}
                          <div className="h-px bg-gray-100 my-1"></div>
                          <button onClick={() => { handleDeleteNote(openNote._id); setOpenNote(null); }} className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 flex items-center gap-3 text-sm">
                             <X size={16} /> Delete Note
                          </button>
                        </div>
                      )}
                   </div>
                   
                   <button onClick={() => setOpenNote(null)} className="ml-2 p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-gray-400">
                     <X size={20}/>
                   </button>
                </div>
             </div>

             {/* Find Bar */}
             {showFind && (
               <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-100 flex items-center gap-3">
                 <Search size={16} className="text-yellow-600"/>
                 <input 
                   autoFocus
                   type="text" 
                   placeholder="Find in note..." 
                   className="bg-transparent border-none outline-none text-sm w-full text-yellow-900 placeholder-yellow-400"
                   value={findWord}
                   onChange={(e) => setFindWord(e.target.value)}
                 />
                 <button onClick={() => { setShowFind(false); setFindWord(""); }} className="text-yellow-600 hover:text-yellow-800"><X size={14}/></button>
               </div>
             )}

             {/* Content Area */}
             <div className="flex-1 flex flex-col overflow-hidden relative">
               <div className="p-6 pb-2">
                 {showEditToolbar && <EditorToolbar type="edit" />}
               </div>
               
               <div className="flex-1 overflow-y-auto px-6 pb-6 relative">
                 <div
                    ref={editEditorRef}
                    contentEditable
                    className="w-full min-h-full outline-none text-gray-700 text-lg leading-relaxed whitespace-pre-wrap"
                    suppressContentEditableWarning={true}
                    onInput={(e) => {
                      const html = e.currentTarget.innerHTML;
                      setUndoStackEdit([...undoStackEdit, editContent]);
                      setEditContent(html);
                      setRedoStackEdit([]);
                    }}
                 ></div>
                 
                 {/* Highlight Overlay (Rendered conditionally) */}
                 {findWord.trim() && (
                    <div 
                      className="absolute inset-0 px-6 pb-6 pointer-events-none text-lg leading-relaxed whitespace-pre-wrap text-transparent z-10"
                      dangerouslySetInnerHTML={{ __html: getHighlightedContent(editContent, findWord).replace(/<mark/g, '<mark style="color:transparent; background: rgba(253, 224, 71, 0.5);"') }}
                    />
                 )}
               </div>
             </div>

             {/* Footer */}
             <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setOpenNote(null)}
                  className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleUpdateContent}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md transition-all"
                >
                  Save Changes
                </button>
              </div>
           </div>
        </div>
      )}

      {/* --- PIN MODAL --- */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl scale-100 animate-in fade-in zoom-in-95 duration-200">
             <div className="text-center mb-6">
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isSettingPin ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                   {isSettingPin ? <Lock size={24}/> : <Unlock size={24}/>}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{isSettingPin ? "Set a Security PIN" : "Enter PIN to Unlock"}</h3>
                <p className="text-sm text-gray-500 mt-1">Keep this note private.</p>
             </div>

             <input
              type="password"
              value={pinInput}
              autoFocus
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full text-center text-2xl tracking-widest border border-gray-300 px-4 py-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="••••"
              maxLength={6}
            />

            {pinError && (
              <div className="bg-red-50 text-red-600 text-sm text-center py-2 rounded-lg mb-4 animate-pulse">
                {pinError}
              </div>
            )}

            <div className="flex gap-3">
               <button
                onClick={() => setShowPinModal(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {isSettingPin ? (
                 <button
                  onClick={handleSubmitPin}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Set PIN
                </button>
              ) : (
                <>
                 {openNote && openNote.isLocked ? (
                   <button
                    onClick={handlePermanentUnlock}
                    className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                   >
                     Remove Lock
                   </button>
                 ) : (
                   <button
                    onClick={handleSubmitPin}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                   >
                     Unlock
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