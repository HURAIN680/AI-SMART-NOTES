import { useEffect, useState, useRef, useCallback } from "react";
import {
  Search, Plus, LogOut, Pin, Lock, Unlock, MoreVertical,
  Undo2, Redo2, Share2, Loader2, StickyNote, X,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  ChevronDown, Trash2, Paperclip, Hash, ArrowUpDown, CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import DOMPurify from "dompurify";
import Logo from "../assets/logo.jpg";
import ConfirmModal from "../components/ConfirmModal";

// ─── Sort helper ────────────────────────────────────────────────────────────
function sortNotes(notes, sortBy) {
  const pinned = notes.filter((n) => n.isPinned);
  const unpinned = notes.filter((n) => !n.isPinned);

  const sortFn = (a, b) => {
    if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === "az") return (a.title || "").localeCompare(b.title || "");
    return new Date(b.createdAt) - new Date(a.createdAt); // newest (default)
  };

  if (sortBy === "pinned") {
    return [...pinned.sort(sortFn), ...unpinned.sort(sortFn)];
  }
  return [...pinned.sort(sortFn), ...unpinned.sort(sortFn)];
}

// ─── Main Component ─────────────────────────────────────────────────────────
function Notes() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Tags state
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [editTags, setEditTags] = useState([]);
  const [editTagInput, setEditTagInput] = useState("");

  // Toolbar toggles
  const [showCreateToolbar, setShowCreateToolbar] = useState(false);
  const [showEditToolbar, setShowEditToolbar] = useState(false);

  // File Upload Refs
  const createFileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
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
  const [activeNoteMenu, setActiveNoteMenu] = useState(null);

  // Order state (for preserving original order on pin/unpin)
  const [originalOrder, setOriginalOrder] = useState([]);

  // Lock/Pin states
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinNote, setPinNote] = useState(null);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [pinError, setPinError] = useState("");

  // Confirm delete modal
  const [confirmModal, setConfirmModal] = useState({ open: false, noteId: null });

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState("idle"); // 'idle' | 'saving' | 'saved'
  const autoSaveTimerRef = useRef(null);

  // ─── API CALLS ───────────────────────────────────────────────────────────
  const fetchNotes = async (searchText = "") => {
    try {
      const res = await api.get("/notes", { params: { search: searchText } });
      setOriginalOrder(res.data.map((note) => note._id));
      setNotes(sortNotes(res.data, sortBy));
    } catch (error) {
      toast.error("Failed to load notes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => fetchNotes(search), 300);
    return () => clearTimeout(delay);
  }, [search]);

  // Re-sort when sortBy changes
  useEffect(() => {
    setNotes((prev) => sortNotes([...prev], sortBy));
  }, [sortBy]);

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

  // Close note-card context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveNoteMenu(null);
    if (activeNoteMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [activeNoteMenu]);

  // Close sort menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowSortMenu(false);
    if (showSortMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showSortMenu]);

  // ─── KEYBOARD SHORTCUTS ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S — save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (openNote && !isSaving) handleUpdateContent();
        else if (showCreateBox && !isSaving) handleCreateNote(e);
      }
      // Escape — close modals
      if (e.key === "Escape") {
        if (showPinModal) { setShowPinModal(false); setPinInput(""); setPinError(""); }
        else if (confirmModal.open) setConfirmModal({ open: false, noteId: null });
        else if (openNote) setOpenNote(null);
        else if (showCreateBox) handleCloseCreate();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openNote, showCreateBox, showPinModal, confirmModal, isSaving]);

  // ─── HANDLERS ────────────────────────────────────────────────────────────
  const triggerFileInput = (type = "create") => {
    if (type === "create") createFileInputRef.current?.click();
    else editFileInputRef.current?.click();
  };

  const handleFileUpload = async (e, type = "create") => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const uploadToast = toast.loading("Uploading file...");
    try {
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const fileUrl = res.data.url;
      const editorRef = type === "create" ? createEditorRef.current : editEditorRef.current;
      if (!editorRef) return;

      let insertHTML = "";
      if (file.type.startsWith("image/")) {
        insertHTML = `<img src="${fileUrl}" alt="attachment" class="my-2 max-w-full rounded-lg" />`;
      } else if (file.type === "application/pdf") {
        insertHTML = `
          <div contenteditable="false" class="my-2 p-2 border rounded-lg bg-gray-50 flex items-center gap-2">
            <span>📄</span>
            <a href="${fileUrl}" target="_blank" class="text-blue-600 underline">${file.name}</a>
          </div>
          <div><br></div>`;
      } else {
        insertHTML = `<a href="${fileUrl}" target="_blank" class="text-blue-600 underline">${file.name}</a><div><br></div>`;
      }

      editorRef.innerHTML += insertHTML;
      if (type === "create") setContent(editorRef.innerHTML);
      else setEditContent(editorRef.innerHTML);
      placeCaretAtEnd(editorRef);

      toast.success("File attached!", { id: uploadToast });
    } catch (err) {
      console.error("File upload failed", err);
      toast.error("Failed to upload file", { id: uploadToast });
    }
  };

  const handleCreateNote = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!content.trim() && !title.trim()) return;
    setIsSaving(true);
    const savingToast = toast.loading("Saving note with AI...");
    try {
      const res = await api.post("/notes", { title, content, tags });
      setNotes((prev) => sortNotes([res.data, ...prev], sortBy));
      setTitle("");
      setContent("");
      setTags([]);
      setTagInput("");
      if (createEditorRef.current) createEditorRef.current.innerHTML = "";
      setUndoStackCreate([]);
      setRedoStackCreate([]);
      setShowCreateBox(false);
      toast.success("Note saved!", { id: savingToast });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save note", { id: savingToast });
    } finally {
      setIsSaving(false);
    }
  };

  // Close create modal — warn if there's unsaved content
  const handleCloseCreate = () => {
    if (content.trim() || title.trim()) {
      if (!window.confirm("Discard unsaved note?")) return;
    }
    setShowCreateBox(false);
    setTitle("");
    setContent("");
    setTags([]);
    setTagInput("");
    if (createEditorRef.current) createEditorRef.current.innerHTML = "";
    setUndoStackCreate([]);
    setRedoStackCreate([]);
  };

  // Trigger confirm modal for delete
  const requestDeleteNote = (id) => {
    setConfirmModal({ open: true, noteId: id });
  };

  const handleDeleteNote = async () => {
    const id = confirmModal.noteId;
    setConfirmModal({ open: false, noteId: null });
    try {
      await api.delete(`/notes/${id}`);
      setNotes((prev) => prev.filter((note) => note._id !== id));
      if (openNote?._id === id) setOpenNote(null);
      toast.success("Note deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete note");
    }
  };

  const handleUpdateTitle = async (id) => {
    if (!editingTitle.trim()) {
      setEditingNoteId(null);
      return;
    }
    try {
      const res = await api.put(`/notes/${id}`, { title: editingTitle });
      setNotes((prev) => prev.map((n) => (n._id === id ? res.data : n)));
      setEditingNoteId(null);
      setEditingTitle("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update title");
    }
  };

  const handleUpdateContent = async () => {
    if (!openNote) return;
    setIsSaving(true);
    setAutoSaveStatus("saving");
    try {
      const res = await api.put(`/notes/${openNote._id}`, {
        content: editContent,
        tags: editTags,
      });
      setNotes((prev) => prev.map((n) => (n._id === openNote._id ? res.data : n)));
      setOpenNote(null);
      setEditContent("");
      setEditTags([]);
      setEditTagInput("");
      setShowFind(false);
      setFindWord("");
      setUndoStackEdit([]);
      setRedoStackEdit([]);
      setAutoSaveStatus("idle");
      toast.success("Changes saved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save changes");
      setAutoSaveStatus("idle");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── AUTO-SAVE ────────────────────────────────────────────────────────────
  // Debounced: fires 2 seconds after user stops typing in the edit modal
  const triggerAutoSave = useCallback((content, tags, noteId) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus("idle");

    autoSaveTimerRef.current = setTimeout(async () => {
      setAutoSaveStatus("saving");
      try {
        const res = await api.put(`/notes/${noteId}`, { content, tags });
        setNotes((prev) => prev.map((n) => (n._id === noteId ? res.data : n)));
        setAutoSaveStatus("saved");
        // Reset indicator after 3s
        setTimeout(() => setAutoSaveStatus("idle"), 3000);
      } catch {
        setAutoSaveStatus("idle");
      }
    }, 2000);
  }, []);

  // ─── UNDO/REDO ───────────────────────────────────────────────────────────
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

  // ─── PIN/LOCK LOGIC ──────────────────────────────────────────────────────
  const handleTogglePin = async (id) => {
    // Optimistic UI — update immediately, roll back on failure
    setNotes((prev) => {
      const updated = prev.map((n) =>
        n._id === id ? { ...n, isPinned: !n.isPinned } : n
      );
      return sortNotes(updated, sortBy);
    });

    try {
      const res = await api.patch(`/notes/${id}/pin`);
      // Sync with server response
      setNotes((prev) =>
        sortNotes(
          prev.map((n) => (n._id === id ? res.data : n)),
          sortBy
        )
      );
    } catch (error) {
      // Roll back
      setNotes((prev) => {
        const rolledBack = prev.map((n) =>
          n._id === id ? { ...n, isPinned: !n.isPinned } : n
        );
        return sortNotes(rolledBack, sortBy);
      });
      toast.error("Failed to pin note");
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
      toast.success(isSettingPin ? "Note locked" : "Note unlocked");
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
      toast.success("Note unlocked permanently");
    } catch (err) {
      setPinError("Incorrect PIN");
    }
  };

  // ─── TAG HANDLERS ────────────────────────────────────────────────────────
  const handleAddTag = (type = "create") => {
    const input = type === "create" ? tagInput : editTagInput;
    const currentTags = type === "create" ? tags : editTags;
    const setCurrentTags = type === "create" ? setTags : setEditTags;
    const setInput = type === "create" ? setTagInput : setEditTagInput;

    if (input.trim() && !currentTags.includes(input.trim())) {
      setCurrentTags([...currentTags, input.trim()]);
      setInput("");
    }
  };

  const handleRemoveTag = (tagToRemove, type = "create") => {
    const currentTags = type === "create" ? tags : editTags;
    const setCurrentTags = type === "create" ? setTags : setEditTags;
    setCurrentTags(currentTags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e, type = "create") => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag(type);
    }
  };

  // ─── UTILS ───────────────────────────────────────────────────────────────
  const shareNote = (noteId) => {
    const link = `${window.location.origin}/share/${noteId}`;
    navigator.clipboard
      .writeText(link)
      .then(() => toast.success("Share link copied to clipboard!"))
      .catch(() => toast.error("Could not copy link"));
  };

  const format = (command, value = null, type = "create") => {
    const ref = type === "edit" ? editEditorRef : createEditorRef;
    const editor = ref.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(command, false, value);
  };

  // Highlight find-in-note results using DOMParser (avoids breaking HTML tags)
  const getHighlightedContent = (html, word) => {
    if (!word.trim()) return DOMPurify.sanitize(html);

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const highlightText = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const regex = new RegExp(`(${word})`, "gi");
        if (regex.test(node.textContent)) {
          const frag = document.createDocumentFragment();
          let lastIndex = 0;
          node.textContent.replace(regex, (match, _, offset) => {
            if (offset > lastIndex) {
              frag.appendChild(
                document.createTextNode(node.textContent.slice(lastIndex, offset))
              );
            }
            const mark = document.createElement("mark");
            mark.className = "bg-yellow-300 rounded-sm";
            mark.textContent = match;
            frag.appendChild(mark);
            lastIndex = offset + match.length;
          });
          if (lastIndex < node.textContent.length) {
            frag.appendChild(
              document.createTextNode(node.textContent.slice(lastIndex))
            );
          }
          node.replaceWith(frag);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        node.childNodes.forEach(highlightText);
      }
    };

    doc.body.childNodes.forEach(highlightText);
    return DOMPurify.sanitize(doc.body.innerHTML);
  };

  // ─── SUB-COMPONENTS ──────────────────────────────────────────────────────
  const EditorToolbar = ({ type }) => (
    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-3 p-2 sm:p-2.5 bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200 rounded-xl shadow-sm">
      <div className="flex gap-0.5 border-r border-gray-300 pr-1.5 sm:pr-2 mr-1">
        <button className="p-1.5 sm:p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-700 transition-all active:scale-95" onClick={() => format("bold", null, type)} title="Bold"><Bold size={16} /></button>
        <button className="p-1.5 sm:p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-700 transition-all active:scale-95" onClick={() => format("italic", null, type)} title="Italic"><Italic size={16} /></button>
        <button className="p-1.5 sm:p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-700 transition-all active:scale-95" onClick={() => format("underline", null, type)} title="Underline"><Underline size={16} /></button>
      </div>

      <div className="flex gap-0.5 border-r border-gray-300 pr-1.5 sm:pr-2 mr-1">
        <button className="p-1.5 sm:p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-700 transition-all active:scale-95" onClick={() => format("justifyLeft", null, type)} title="Align Left"><AlignLeft size={16} /></button>
        <button className="p-1.5 sm:p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-700 transition-all active:scale-95" onClick={() => format("justifyCenter", null, type)} title="Align Center"><AlignCenter size={16} /></button>
        <button className="p-1.5 sm:p-2 hover:bg-white hover:shadow-sm rounded-lg text-gray-700 transition-all active:scale-95" onClick={() => format("justifyRight", null, type)} title="Align Right"><AlignRight size={16} /></button>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <select
          onChange={(e) => format("fontSize", e.target.value, type)}
          className="bg-white text-xs sm:text-sm text-gray-700 font-medium focus:outline-none cursor-pointer px-2 py-1 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
        >
          <option value="3">Normal</option>
          <option value="1">Small</option>
          <option value="5">Large</option>
          <option value="7">Huge</option>
        </select>

        <div className="relative group flex items-center">
          <input type="color" className="opacity-0 w-8 h-8 cursor-pointer absolute" onChange={(e) => format("foreColor", e.target.value, type)} />
          <button type="button" className="w-8 h-8 rounded-lg border-2 border-gray-300 bg-gradient-to-br from-red-400 via-purple-400 to-blue-400 hover:scale-110 transition-transform shadow-sm" title="Text Color"></button>
        </div>

        <button
          type="button"
          onClick={() => triggerFileInput(type)}
          title="Attach File"
          className="p-1.5 sm:p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-gray-600 transition-all border border-transparent hover:border-blue-200 active:scale-95 flex items-center gap-1"
        >
          <Paperclip size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span className="text-xs font-medium hidden sm:inline">Attach</span>
        </button>
      </div>
    </div>
  );

  // Auto-save status indicator
  const AutoSaveIndicator = () => {
    if (autoSaveStatus === "idle") return null;
    if (autoSaveStatus === "saving")
      return (
        <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
          <Loader2 size={12} className="animate-spin" />
          Saving...
        </span>
      );
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
        <CheckCircle2 size={12} />
        Saved
      </span>
    );
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 text-slate-800">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={Logo} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl shadow-lg shadow-blue-200/50 object-cover ring-2 ring-blue-100" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                My Notes
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 hidden sm:block font-medium">Capture &amp; organize beautifully</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateBox(true)}
              className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all duration-200"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline text-sm">New Note</span>
            </button>
            <button
              onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}
              className="p-2 sm:p-2.5 bg-white text-slate-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-xl transition-all duration-200 shadow-sm"
              title="Logout"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* ── SEARCH + SORT BAR ──────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-3">
          {/* Search */}
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search notes, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-sm hover:shadow-md transition-all duration-200"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowSortMenu((v) => !v); }}
              className="flex items-center gap-2 px-3 py-3 bg-white/90 border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
              title="Sort"
            >
              <ArrowUpDown size={16} />
              <span className="hidden sm:inline">
                {{ newest: "Newest", oldest: "Oldest", az: "A–Z", pinned: "Pinned" }[sortBy]}
              </span>
            </button>
            {showSortMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                {[
                  { key: "newest", label: "Newest first" },
                  { key: "oldest", label: "Oldest first" },
                  { key: "az", label: "A – Z" },
                  { key: "pinned", label: "Pinned first" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setSortBy(key); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-all ${sortBy === key ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Note count */}
        {!loading && (
          <p className="text-xs text-gray-400 mb-5 pl-1 font-medium">
            {notes.length === 0
              ? "No notes"
              : search
              ? `${notes.length} result${notes.length !== 1 ? "s" : ""} for "${search}"`
              : `${notes.length} note${notes.length !== 1 ? "s" : ""}`}
          </p>
        )}

        {/* ── CREATE MODAL ───────────────────────────────────────────── */}
        {showCreateBox && (
          <div className="fixed inset-0 z-50 bg-white animate-in fade-in duration-200">
            <div className="h-full bg-white w-full flex flex-col overflow-hidden">

              {/* Modal Header */}
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-blue-50/30 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">Create Note</h2>
                <div className="flex gap-1 sm:gap-2 items-center">
                  <span className="hidden sm:block text-xs text-gray-400 mr-1">Ctrl+S to save</span>
                  <button onClick={handleUndoCreate} className="p-2 hover:bg-white rounded-lg text-gray-500 transition-all active:scale-95 hover:shadow-sm"><Undo2 size={18} /></button>
                  <button onClick={handleRedoCreate} className="p-2 hover:bg-white rounded-lg text-gray-500 transition-all active:scale-95 hover:shadow-sm"><Redo2 size={18} /></button>
                  <button onClick={() => setShowCreateToolbar(!showCreateToolbar)} className="p-2 hover:bg-white rounded-lg text-gray-500 transition-all active:scale-95">
                    <ChevronDown size={18} className={`transition-transform ${showCreateToolbar ? "rotate-180" : ""}`} />
                  </button>
                  <button onClick={handleCloseCreate} className="p-2 hover:bg-red-100 hover:text-red-600 rounded-lg text-gray-400 transition-all active:scale-95"><X size={20} /></button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col">
                <input
                  type="text"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xl sm:text-2xl font-bold text-gray-800 placeholder-gray-300 border-none outline-none bg-transparent mb-4"
                />

                {/* Tags */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Add tags..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => handleTagKeyDown(e, "create")}
                      className="flex-1 text-sm text-gray-700 placeholder-gray-400 border-none outline-none bg-transparent"
                    />
                    <button onClick={() => handleAddTag("create")} className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all active:scale-95 font-medium">Add</button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg text-xs font-medium shadow-sm">
                          <Hash className="w-3 h-3" />{tag}
                          <button onClick={() => handleRemoveTag(tag, "create")} className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {showCreateToolbar && <EditorToolbar type="create" />}

                <div
                  ref={createEditorRef}
                  contentEditable
                  className="flex-1 w-full outline-none text-gray-600 text-base sm:text-lg leading-relaxed whitespace-pre-wrap empty:before:content-[attr(placeholder)] empty:before:text-gray-300 min-h-[200px]"
                  placeholder="Start writing..."
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
              <div className="px-4 py-3 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30 flex justify-end gap-2 sticky bottom-0 backdrop-blur-sm">
                <button onClick={handleCloseCreate} className="px-4 py-2 text-sm text-gray-600 font-medium hover:bg-white rounded-lg transition-all active:scale-95 border border-gray-200">Cancel</button>
                <button
                  onClick={handleCreateNote}
                  disabled={isSaving}
                  className="px-5 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? <><Loader2 size={15} className="animate-spin" />Saving...</> : "Save Note"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── NOTES GRID ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin w-10 h-10 text-blue-500 mb-4" />
            <p className="text-gray-400 text-sm font-medium">Loading...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-24 text-center px-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200/50">
              <StickyNote className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              {search ? "No notes found" : "No notes yet"}
            </h3>
            <p className="text-sm text-gray-500 max-w-xs mb-8">
              {search ? `No notes match "${search}"` : "Start capturing your brilliant ideas and thoughts"}
            </p>
            {!search && (
              <button onClick={() => setShowCreateBox(true)} className="text-blue-600 text-sm font-semibold hover:text-blue-700 flex items-center gap-2 group">
                Create your first note
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pb-20">
            {notes.map((note) => (
              <div
                key={note._id}
                className={`
                  relative bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/60
                  hover:border-blue-300/70 hover:shadow-xl hover:shadow-blue-100/50
                  transition-all duration-300 ease-out cursor-pointer hover:-translate-y-1
                  overflow-hidden group
                  ${note.isPinned ? "ring-2 ring-orange-200/60 bg-gradient-to-br from-orange-50/40 to-white shadow-lg shadow-orange-100/30" : "shadow-sm hover:shadow-lg"}
                `}
              >
                {/* Note Header */}
                <div className="flex items-start justify-between p-3 sm:p-4 gap-2">
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => {
                      if (note.isLocked) {
                        setPinNote(note);
                        setIsSettingPin(false);
                        setShowPinModal(true);
                        return;
                      }
                      setOpenNote(note);
                      setEditContent(note.content);
                      setEditTags(note.tags || []);
                      setEditTagInput("");
                      setUndoStackEdit([]);
                      setRedoStackEdit([]);
                      setShowFind(false);
                      setFindWord("");
                    }}
                  >
                    {note.isPinned && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 rounded-full text-xs font-semibold mb-2 shadow-sm">
                        <Pin className="w-3 h-3 fill-orange-600" />
                        <span>Pinned</span>
                      </div>
                    )}

                    {editingNoteId === note._id ? (
                      <input
                        value={editingTitle}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleUpdateTitle(note._id)}
                        onKeyDown={(e) => e.key === "Enter" && handleUpdateTitle(note._id)}
                        className="w-full text-base sm:text-lg font-bold p-1 -ml-1 border-b-2 border-blue-500 bg-transparent focus:outline-none"
                      />
                    ) : (
                      <h3
                        className={`text-base sm:text-lg font-bold text-gray-800 mb-1 leading-tight truncate ${!note.title && "text-gray-400 italic"} ${note.isLocked ? "blur-sm" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!note.isLocked) {
                            setEditingNoteId(note._id);
                            setEditingTitle(note.title || "");
                          }
                        }}
                      >
                        {note.title || "Untitled"}
                      </h3>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleTogglePin(note._id); }}
                      className={`p-1.5 sm:p-2 rounded-lg transition-all active:scale-95 ${note.isPinned ? "bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600 shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-600 hover:shadow-sm"}`}
                      title={note.isPinned ? "Unpin" : "Pin"}
                    >
                      <Pin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleLock(note); }}
                      className={`p-1.5 sm:p-2 rounded-lg transition-all active:scale-95 ${note.isLocked ? "bg-gradient-to-br from-red-100 to-red-200 text-red-600 shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm"}`}
                      title={note.isLocked ? "Unlock" : "Lock"}
                    >
                      {note.isLocked ? <Unlock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); requestDeleteNote(note._id); }}
                      className="p-1.5 sm:p-2 bg-gray-100 rounded-lg text-gray-500 hover:bg-gradient-to-br hover:from-red-50 hover:to-red-100 hover:text-red-600 transition-all active:scale-95 hover:shadow-sm"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                {/* Note Content */}
                <div
                  className="px-3 sm:px-4 pb-3 sm:pb-4 cursor-pointer"
                  onClick={() => {
                    if (note.isLocked) {
                      setPinNote(note);
                      setIsSettingPin(false);
                      setShowPinModal(true);
                      return;
                    }
                    setOpenNote(note);
                    setEditContent(note.content);
                    setEditTags(note.tags || []);
                    setEditTagInput("");
                    setUndoStackEdit([]);
                    setRedoStackEdit([]);
                    setShowFind(false);
                    setFindWord("");
                  }}
                >
                  <p className={`text-sm text-gray-600 line-clamp-3 leading-relaxed ${note.isLocked ? "blur-sm select-none" : ""}`}>
                    {note.summary || note.content?.replace(/<[^>]*>?/gm, "").substring(0, 150) || "Empty note"}
                  </p>

                  {/* Tags — clickable to filter */}
                  {note.tags && note.tags.length > 0 && !note.isLocked && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {note.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          onClick={(e) => { e.stopPropagation(); setSearch(tag); }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors"
                          title={`Filter by #${tag}`}
                        >
                          <Hash className="w-2.5 h-2.5" />{tag}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                          +{note.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {note.isLocked && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded-md inline-flex">
                      <Lock className="w-3 h-3" /><span>Locked</span>
                    </div>
                  )}

                  <div className="mt-3 text-xs text-gray-400">
                    {new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── EDIT MODAL ─────────────────────────────────────────────────── */}
      {openNote && (
        <div className="fixed inset-0 z-50 bg-white animate-in fade-in duration-200">
          <div className="h-full bg-white w-full flex flex-col overflow-hidden">

            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-blue-50/30 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
              <div className="flex-1 min-w-0 mr-3">
                <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent truncate">
                  {openNote.title || "Untitled"}
                </h2>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-gray-400 hidden sm:block">
                    {new Date(openNote.updatedAt || openNote.createdAt).toLocaleString()}
                  </p>
                  <AutoSaveIndicator />
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <span className="hidden sm:block text-xs text-gray-400 mr-1">Ctrl+S</span>
                <button onClick={handleUndoEdit} className="p-2 hover:bg-white rounded-lg text-gray-500 transition-all active:scale-95 hover:shadow-sm"><Undo2 size={18} /></button>
                <button onClick={handleRedoEdit} className="p-2 hover:bg-white rounded-lg text-gray-500 transition-all active:scale-95 hover:shadow-sm"><Redo2 size={18} /></button>
                <button onClick={() => setShowEditToolbar(!showEditToolbar)} className="p-2 hover:bg-white rounded-lg text-gray-500 transition-all active:scale-95">
                  <ChevronDown size={18} className={`transition-transform ${showEditToolbar ? "rotate-180" : ""}`} />
                </button>

                {/* Options Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    className={`p-2 rounded-lg text-gray-500 transition-all active:scale-95 ${showOptions ? "bg-blue-50 text-blue-600" : "hover:bg-white hover:shadow-sm"}`}
                  >
                    <MoreVertical size={18} />
                  </button>
                  {showOptions && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button onClick={() => { setShowFind(!showFind); setShowOptions(false); }} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/50 flex items-center gap-3 text-sm text-gray-700 transition-all">
                        <Search size={16} /> Find in note
                      </button>
                      <button onClick={() => { shareNote(openNote._id); setShowOptions(false); }} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/50 flex items-center gap-3 text-sm text-gray-700 transition-all">
                        <Share2 size={16} /> Share
                      </button>
                      {openNote.isLocked && (
                        <button onClick={() => { setPinInput(""); setPinError(""); setShowPinModal(true); setShowOptions(false); }} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100/50 flex items-center gap-3 text-sm text-gray-700 transition-all">
                          <Unlock size={16} /> Unlock
                        </button>
                      )}
                      <div className="h-px bg-gray-100"></div>
                      <button onClick={() => { requestDeleteNote(openNote._id); setShowOptions(false); }} className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100/50 text-red-600 flex items-center gap-3 text-sm transition-all">
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  )}
                </div>

                <button onClick={() => setOpenNote(null)} className="ml-1 p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-gray-400 transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Find Bar */}
            {showFind && (
              <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100 flex items-center gap-3">
                <Search size={16} className="text-yellow-600" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Find in note..."
                  className="bg-transparent border-none outline-none text-sm w-full text-yellow-900 placeholder-yellow-400"
                  value={findWord}
                  onChange={(e) => setFindWord(e.target.value)}
                />
                <button onClick={() => { setShowFind(false); setFindWord(""); }} className="text-yellow-600 hover:text-yellow-800"><X size={14} /></button>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* Tags */}
              <div className="px-4 sm:px-6 pt-4 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Add tags..."
                    value={editTagInput}
                    onChange={(e) => setEditTagInput(e.target.value)}
                    onKeyDown={(e) => handleTagKeyDown(e, "edit")}
                    className="flex-1 text-sm text-gray-700 placeholder-gray-400 border-none outline-none bg-transparent"
                  />
                  <button onClick={() => handleAddTag("edit")} className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all active:scale-95 font-medium">Add</button>
                </div>
                {editTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-2">
                    {editTags.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg text-xs font-medium shadow-sm">
                        <Hash className="w-3 h-3" />{tag}
                        <button onClick={() => handleRemoveTag(tag, "edit")} className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {showEditToolbar && (
                <div className="p-3 sm:p-4 pb-2">
                  <EditorToolbar type="edit" />
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 relative">
                <div
                  ref={editEditorRef}
                  contentEditable
                  className="w-full min-h-full outline-none text-gray-700 text-base sm:text-lg leading-relaxed whitespace-pre-wrap"
                  suppressContentEditableWarning={true}
                  onInput={(e) => {
                    const html = e.currentTarget.innerHTML;
                    setUndoStackEdit([...undoStackEdit, editContent]);
                    setEditContent(html);
                    setRedoStackEdit([]);
                    // Trigger auto-save
                    triggerAutoSave(html, editTags, openNote._id);
                  }}
                ></div>

                {/* Find highlight overlay */}
                {findWord.trim() && (
                  <div
                    className="absolute inset-0 px-4 sm:px-6 pb-6 pointer-events-none text-base sm:text-lg leading-relaxed whitespace-pre-wrap text-transparent z-10"
                    dangerouslySetInnerHTML={{
                      __html: getHighlightedContent(editContent, findWord).replace(
                        /<mark/g,
                        '<mark style="color:transparent; background: rgba(253, 224, 71, 0.5);"'
                      ),
                    }}
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30 flex justify-end gap-2 sticky bottom-0 backdrop-blur-sm">
              <button onClick={() => setOpenNote(null)} className="px-4 py-2 text-sm text-gray-600 font-medium hover:bg-white rounded-lg transition-all active:scale-95 border border-gray-200">Close</button>
              <button
                onClick={handleUpdateContent}
                disabled={isSaving}
                className="px-5 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? <><Loader2 size={15} className="animate-spin" />Saving...</> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PIN MODAL ──────────────────────────────────────────────────── */}
      {showPinModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900/60 to-slate-900/80 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 sm:p-8 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="text-center mb-6">
              <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${isSettingPin ? "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 shadow-blue-500/30" : "bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600 shadow-orange-500/30"}`}>
                {isSettingPin ? <Lock size={26} /> : <Unlock size={26} />}
              </div>
              <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {isSettingPin ? "Set Security PIN" : "Enter PIN"}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Keep your note secure</p>
            </div>

            <input
              type="password"
              value={pinInput}
              autoFocus
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (isSettingPin ? handleSubmitPin() : openNote?.isLocked ? handlePermanentUnlock() : handleSubmitPin())}
              className="w-full text-center text-xl sm:text-2xl tracking-widest border-2 border-gray-300 px-4 py-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 font-bold"
              placeholder="••••"
              maxLength={6}
            />

            {pinError && (
              <div className="bg-gradient-to-r from-red-50 to-red-100 text-red-600 text-sm text-center py-2.5 rounded-lg mb-4 animate-in fade-in slide-in-from-top-2 duration-200 font-medium border border-red-200">
                {pinError}
              </div>
            )}

            <div className="flex gap-2 sm:gap-3">
              <button onClick={() => { setShowPinModal(false); setPinInput(""); setPinError(""); }} className="flex-1 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all active:scale-95">Cancel</button>
              {isSettingPin ? (
                <button onClick={handleSubmitPin} className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 active:scale-95">Set PIN</button>
              ) : (
                <>
                  {openNote && openNote.isLocked ? (
                    <button onClick={handlePermanentUnlock} className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/30 active:scale-95">Remove Lock</button>
                  ) : (
                    <button onClick={handleSubmitPin} className="flex-1 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 active:scale-95">Unlock</button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE MODAL ───────────────────────────────────────── */}
      <ConfirmModal
        open={confirmModal.open}
        title="Delete note?"
        message="This note will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteNote}
        onCancel={() => setConfirmModal({ open: false, noteId: null })}
      />

      {/* Hidden file inputs */}
      <input type="file" ref={createFileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, "create")} />
      <input type="file" ref={editFileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, "edit")} />
    </div>
  );
}

export default Notes;