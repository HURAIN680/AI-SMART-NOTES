import { useEffect, useState, useRef, useCallback } from "react";
import {
  Search, Plus, LogOut, Pin, Lock, Unlock, MoreVertical,
  Undo2, Redo2, Share2, Loader2, StickyNote, X,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  ChevronDown, Trash2, Paperclip, Hash, ArrowUpDown, CheckCircle2,
  Moon, Sun, Palette, Sparkles, Download, Printer, Bot, ChevronUp
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import DOMPurify from "dompurify";
import Logo from "../assets/logo.jpg";
import ConfirmModal from "../components/ConfirmModal";

// ─── Note color palette ─────────────────────────────────────────────────────
const NOTE_COLORS = {
  default: { label: "Default", swatch: "bg-gray-300 dark:bg-slate-600", card: "" },
  red:    { label: "Red",    swatch: "bg-red-400",    card: "border-l-[3px] border-l-red-400 !bg-red-50/70 dark:!bg-red-950/25" },
  orange: { label: "Orange", swatch: "bg-orange-400", card: "border-l-[3px] border-l-orange-400 !bg-orange-50/70 dark:!bg-orange-950/25" },
  yellow: { label: "Yellow", swatch: "bg-yellow-400", card: "border-l-[3px] border-l-yellow-400 !bg-yellow-50/70 dark:!bg-yellow-950/25" },
  green:  { label: "Green",  swatch: "bg-green-400",  card: "border-l-[3px] border-l-green-400 !bg-green-50/70 dark:!bg-green-950/25" },
  teal:   { label: "Teal",   swatch: "bg-teal-400",   card: "border-l-[3px] border-l-teal-400 !bg-teal-50/70 dark:!bg-teal-950/25" },
  blue:   { label: "Blue",   swatch: "bg-blue-400",   card: "border-l-[3px] border-l-blue-400 !bg-blue-50/70 dark:!bg-blue-950/25" },
  purple: { label: "Purple", swatch: "bg-purple-400", card: "border-l-[3px] border-l-purple-400 !bg-purple-50/70 dark:!bg-purple-950/25" },
};

// ─── HTML → Markdown converter (for export) ─────────────────────────────────
function htmlToMarkdown(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent;
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const tag = node.tagName.toLowerCase();
    const children = Array.from(node.childNodes).map(processNode).join("");
    switch (tag) {
      case "strong": case "b": return `**${children}**`;
      case "em":     case "i": return `*${children}*`;
      case "u":                return `_${children}_`;
      case "br":               return "\n";
      case "p": case "div":   return `${children}\n\n`;
      case "h1": return `# ${children}\n\n`;
      case "h2": return `## ${children}\n\n`;
      case "h3": return `### ${children}\n\n`;
      case "li": return `- ${children}\n`;
      case "a":  return `[${children}](${node.getAttribute("href") || ""})`;
      case "img":return `![${node.getAttribute("alt") || "image"}](${node.getAttribute("src") || ""})`;
      default:   return children;
    }
  }
  return Array.from(div.childNodes).map(processNode).join("").replace(/\n{3,}/g, "\n\n").trim();
}

// ─── Sort helper ─────────────────────────────────────────────────────────────
function sortNotes(notes, sortBy) {
  const pinned   = notes.filter(n => n.isPinned);
  const unpinned = notes.filter(n => !n.isPinned);
  const sortFn = (a, b) => {
    if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === "az")     return (a.title || "").localeCompare(b.title || "");
    return new Date(b.createdAt) - new Date(a.createdAt);
  };
  return [...pinned.sort(sortFn), ...unpinned.sort(sortFn)];
}

// ─── Main Component ───────────────────────────────────────────────────────────
function Notes() {
  // Core state
  const [notes,        setNotes]        = useState([]);
  const [title,        setTitle]        = useState("");
  const [content,      setContent]      = useState("");
  const [loading,      setLoading]      = useState(true);
  const [isSaving,     setIsSaving]     = useState(false);
  const [search,       setSearch]       = useState("");
  const [sortBy,       setSortBy]       = useState("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Tags
  const [tags,         setTags]         = useState([]);
  const [tagInput,     setTagInput]     = useState("");
  const [editTags,     setEditTags]     = useState([]);
  const [editTagInput, setEditTagInput] = useState("");

  // Toolbar
  const [showCreateToolbar, setShowCreateToolbar] = useState(false);
  const [showEditToolbar,   setShowEditToolbar]   = useState(false);

  // Refs
  const createFileInputRef = useRef(null);
  const editFileInputRef   = useRef(null);
  const createEditorRef    = useRef(null);
  const editEditorRef      = useRef(null);

  // Modals & views
  const [showCreateBox,  setShowCreateBox]  = useState(false);
  const [openNote,       setOpenNote]       = useState(null);
  const [editContent,    setEditContent]    = useState("");
  const [editingNoteId,  setEditingNoteId]  = useState(null);
  const [editingTitle,   setEditingTitle]   = useState("");

  // Undo/redo
  const [undoStackCreate, setUndoStackCreate] = useState([]);
  const [redoStackCreate, setRedoStackCreate] = useState([]);
  const [undoStackEdit,   setUndoStackEdit]   = useState([]);
  const [redoStackEdit,   setRedoStackEdit]   = useState([]);

  // Find
  const [showFind,  setShowFind]  = useState(false);
  const [findWord,  setFindWord]  = useState("");

  // Options dropdown in edit modal
  const [showOptions, setShowOptions] = useState(false);

  // Pin order
  const [originalOrder, setOriginalOrder] = useState([]);

  // Lock/PIN
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput,     setPinInput]     = useState("");
  const [pinNote,      setPinNote]      = useState(null);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [pinError,     setPinError]     = useState("");

  // Confirm delete
  const [confirmModal, setConfirmModal] = useState({ open: false, noteId: null });

  // Auto-save
  const [autoSaveStatus, setAutoSaveStatus] = useState("idle");
  const autoSaveTimerRef = useRef(null);

  // ── NEW: Dark mode ──────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(false);

  // ── NEW: Note colors ───────────────────────────────────────────────────
  const [showColorPicker, setShowColorPicker] = useState(null); // noteId

  // ── NEW: AI Q&A ────────────────────────────────────────────────────────
  const [showAskPanel,  setShowAskPanel]  = useState(false);
  const [askQuestion,   setAskQuestion]   = useState("");
  const [askAnswer,     setAskAnswer]     = useState(null);
  const [isAsking,      setIsAsking]      = useState(false);

  // ─── EFFECTS ─────────────────────────────────────────────────────────────
  // Init dark mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    const isDark = saved === "dark";
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
    else        document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => fetchNotes(search), 300);
    return () => clearTimeout(delay);
  }, [search]);

  useEffect(() => { setNotes(prev => sortNotes([...prev], sortBy)); }, [sortBy]);

  useEffect(() => {
    if (!openNote) { setShowOptions(false); setShowFind(false); setShowAskPanel(false); setAskAnswer(null); setAskQuestion(""); }
  }, [openNote]);

  useEffect(() => {
    if (openNote && editEditorRef.current) editEditorRef.current.innerHTML = openNote.content || "";
  }, [openNote]);

  // Close sort menu on outside click
  useEffect(() => {
    const close = () => setShowSortMenu(false);
    if (showSortMenu) { document.addEventListener("click", close); return () => document.removeEventListener("click", close); }
  }, [showSortMenu]);

  // Close color picker on outside click
  useEffect(() => {
    const close = () => setShowColorPicker(null);
    if (showColorPicker) { document.addEventListener("click", close); return () => document.removeEventListener("click", close); }
  }, [showColorPicker]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (openNote && !isSaving) handleUpdateContent();
        else if (showCreateBox && !isSaving) handleCreateNote(e);
      }
      if (e.key === "Escape") {
        if (showPinModal)       { setShowPinModal(false); setPinInput(""); setPinError(""); }
        else if (confirmModal.open) setConfirmModal({ open: false, noteId: null });
        else if (showColorPicker)   setShowColorPicker(null);
        else if (showAskPanel)      setShowAskPanel(false);
        else if (openNote)          setOpenNote(null);
        else if (showCreateBox)     handleCloseCreate();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openNote, showCreateBox, showPinModal, confirmModal, isSaving, showColorPicker, showAskPanel]);

  // ─── API ─────────────────────────────────────────────────────────────────
  const fetchNotes = async (searchText = "") => {
    try {
      const res = await api.get("/notes", { params: { search: searchText } });
      setOriginalOrder(res.data.map(n => n._id));
      setNotes(sortNotes(res.data, sortBy));
    } catch {
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  // ─── DARK MODE ───────────────────────────────────────────────────────────
  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) { document.documentElement.classList.add("dark");    localStorage.setItem("theme", "dark"); }
    else       { document.documentElement.classList.remove("dark"); localStorage.setItem("theme", "light"); }
  };

  // ─── FILE UPLOAD ─────────────────────────────────────────────────────────
  const triggerFileInput = (type = "create") => {
    if (type === "create") createFileInputRef.current?.click();
    else editFileInputRef.current?.click();
  };

  const handleFileUpload = async (e, type = "create") => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const tid = toast.loading("Uploading file...");
    try {
      const res = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const fileUrl = res.data.url;
      const editorRef = type === "create" ? createEditorRef.current : editEditorRef.current;
      if (!editorRef) return;
      let insertHTML = "";
      if (file.type.startsWith("image/"))          insertHTML = `<img src="${fileUrl}" alt="attachment" class="my-2 max-w-full rounded-lg" />`;
      else if (file.type === "application/pdf")    insertHTML = `<div contenteditable="false" class="my-2 p-2 border rounded-lg bg-gray-50 flex items-center gap-2"><span>📄</span><a href="${fileUrl}" target="_blank" class="text-blue-600 underline">${file.name}</a></div><div><br></div>`;
      else                                          insertHTML = `<a href="${fileUrl}" target="_blank" class="text-blue-600 underline">${file.name}</a><div><br></div>`;
      editorRef.innerHTML += insertHTML;
      if (type === "create") setContent(editorRef.innerHTML);
      else setEditContent(editorRef.innerHTML);
      placeCaretAtEnd(editorRef);
      toast.success("File attached!", { id: tid });
    } catch {
      toast.error("Failed to upload file", { id: tid });
    }
  };

  // ─── CREATE NOTE ─────────────────────────────────────────────────────────
  const handleCreateNote = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!content.trim() && !title.trim()) return;
    setIsSaving(true);
    const tid = toast.loading("Saving note with AI…");
    try {
      const res = await api.post("/notes", { title, content, tags });
      setNotes(prev => sortNotes([res.data, ...prev], sortBy));
      setTitle(""); setContent(""); setTags([]); setTagInput("");
      if (createEditorRef.current) createEditorRef.current.innerHTML = "";
      setUndoStackCreate([]); setRedoStackCreate([]);
      setShowCreateBox(false);
      toast.success("Note saved!", { id: tid });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save note", { id: tid });
    } finally { setIsSaving(false); }
  };

  const handleCloseCreate = () => {
    if (content.trim() || title.trim()) {
      if (!window.confirm("Discard unsaved note?")) return;
    }
    setShowCreateBox(false); setTitle(""); setContent(""); setTags([]); setTagInput("");
    if (createEditorRef.current) createEditorRef.current.innerHTML = "";
    setUndoStackCreate([]); setRedoStackCreate([]);
  };

  // ─── DELETE ──────────────────────────────────────────────────────────────
  const requestDeleteNote = (id) => setConfirmModal({ open: true, noteId: id });

  const handleDeleteNote = async () => {
    const id = confirmModal.noteId;
    setConfirmModal({ open: false, noteId: null });
    try {
      await api.delete(`/notes/${id}`);
      setNotes(prev => prev.filter(n => n._id !== id));
      if (openNote?._id === id) setOpenNote(null);
      toast.success("Note deleted");
    } catch { toast.error("Failed to delete note"); }
  };

  // ─── UPDATE ──────────────────────────────────────────────────────────────
  const handleUpdateTitle = async (id) => {
    if (!editingTitle.trim()) { setEditingNoteId(null); return; }
    try {
      const res = await api.put(`/notes/${id}`, { title: editingTitle });
      setNotes(prev => prev.map(n => n._id === id ? res.data : n));
      setEditingNoteId(null); setEditingTitle("");
    } catch { toast.error("Failed to update title"); }
  };

  const handleUpdateContent = async () => {
    if (!openNote) return;
    setIsSaving(true); setAutoSaveStatus("saving");
    try {
      const res = await api.put(`/notes/${openNote._id}`, { content: editContent, tags: editTags });
      setNotes(prev => prev.map(n => n._id === openNote._id ? res.data : n));
      setOpenNote(null); setEditContent(""); setEditTags([]); setEditTagInput("");
      setShowFind(false); setFindWord(""); setUndoStackEdit([]); setRedoStackEdit([]);
      setAutoSaveStatus("idle");
      toast.success("Changes saved");
    } catch { toast.error("Failed to save changes"); setAutoSaveStatus("idle"); }
    finally { setIsSaving(false); }
  };

  // ─── AUTO-SAVE ───────────────────────────────────────────────────────────
  const triggerAutoSave = useCallback((html, tags, noteId) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setAutoSaveStatus("idle");
    autoSaveTimerRef.current = setTimeout(async () => {
      setAutoSaveStatus("saving");
      try {
        const res = await api.put(`/notes/${noteId}`, { content: html, tags });
        setNotes(prev => prev.map(n => n._id === noteId ? res.data : n));
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus("idle"), 3000);
      } catch { setAutoSaveStatus("idle"); }
    }, 2000);
  }, []);

  // ─── NOTE COLORS ─────────────────────────────────────────────────────────
  const handleChangeColor = async (noteId, color) => {
    const prevColor = notes.find(n => n._id === noteId)?.color || "default";
    setNotes(prev => prev.map(n => n._id === noteId ? { ...n, color } : n));
    setShowColorPicker(null);
    try {
      await api.put(`/notes/${noteId}`, { color });
    } catch {
      setNotes(prev => prev.map(n => n._id === noteId ? { ...n, color: prevColor } : n));
      toast.error("Failed to change color");
    }
  };

  // ─── AI Q&A ──────────────────────────────────────────────────────────────
  const handleAskAI = async () => {
    if (!askQuestion.trim() || !openNote) return;
    setIsAsking(true); setAskAnswer(null);
    try {
      const res = await api.post(`/notes/${openNote._id}/ask`, { question: askQuestion });
      setAskAnswer(res.data.answer);
    } catch (err) {
      toast.error(err.response?.data?.message || "AI couldn't answer — try again");
    } finally { setIsAsking(false); }
  };

  // ─── EXPORT ──────────────────────────────────────────────────────────────
  const exportMarkdown = (note) => {
    const md = [
      `# ${note.title || "Untitled"}`,
      ``,
      `*Created: ${new Date(note.createdAt).toLocaleString()}*`,
      ``,
      note.summary ? `> **AI Summary:** ${note.summary}\n` : "",
      htmlToMarkdown(note.content || ""),
      note.tags?.length ? `\n---\n**Tags:** ${note.tags.map(t => `#${t}`).join(" ")}` : "",
    ].join("\n");

    const blob = new Blob([md], { type: "text/markdown" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `${note.title || "note"}.md`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Markdown file downloaded");
  };

  const printNote = (note) => {
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><title>${note.title || "Note"}</title>
    <style>
      body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 0 24px; color: #111; line-height: 1.7; }
      h1 { font-size: 2rem; font-weight: bold; margin-bottom: 0.25rem; }
      .meta { color: #777; font-size: 0.9rem; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
      .summary { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 1rem 1.25rem; margin: 1.5rem 0; border-radius: 0 8px 8px 0; }
      .summary strong { display: block; margin-bottom: 0.25rem; color: #92400e; }
      .content img { max-width: 100%; border-radius: 8px; }
      .tags { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #eee; font-size: 0.85rem; color: #555; }
      .tag { display: inline-block; background: #f0f0f0; padding: 2px 10px; border-radius: 20px; margin: 2px; }
      @media print { body { margin: 20px; } }
    </style></head><body>
    <h1>${note.title || "Untitled"}</h1>
    <div class="meta">Created ${new Date(note.createdAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
    ${note.summary ? `<div class="summary"><strong>✨ AI Summary</strong>${DOMPurify.sanitize(note.summary)}</div>` : ""}
    <div class="content">${DOMPurify.sanitize(note.content || "")}</div>
    ${note.tags?.length ? `<div class="tags">${note.tags.map(t => `<span class="tag">#${t}</span>`).join("")}</div>` : ""}
    </body></html>`);
    win.document.close(); win.focus();
    setTimeout(() => win.print(), 400);
  };

  // ─── PIN/LOCK ─────────────────────────────────────────────────────────────
  const handleTogglePin = async (id) => {
    setNotes(prev => sortNotes(prev.map(n => n._id === id ? { ...n, isPinned: !n.isPinned } : n), sortBy));
    try {
      const res = await api.patch(`/notes/${id}/pin`);
      setNotes(prev => sortNotes(prev.map(n => n._id === id ? res.data : n), sortBy));
    } catch {
      setNotes(prev => sortNotes(prev.map(n => n._id === id ? { ...n, isPinned: !n.isPinned } : n), sortBy));
      toast.error("Failed to pin note");
    }
  };

  const handleToggleLock = (note) => { setPinNote(note); setIsSettingPin(!note.isLocked); setPinInput(""); setPinError(""); setShowPinModal(true); };

  const handleSubmitPin = async () => {
    if (!pinInput.trim()) return;
    try {
      const endpoint = isSettingPin ? `/notes/${pinNote._id}/lock` : `/notes/${pinNote._id}/verify-pin`;
      const res = await api.patch(endpoint, { pin: pinInput });
      if (!isSettingPin) { setOpenNote(pinNote); setEditContent(pinNote.content); }
      setNotes(prev => prev.map(n => n._id === pinNote._id ? res.data : n));
      setShowPinModal(false); setPinInput("");
      toast.success(isSettingPin ? "Note locked" : "Note unlocked");
    } catch { setPinError("Incorrect PIN"); }
  };

  const handlePermanentUnlock = async () => {
    if (!pinInput.trim()) return;
    try {
      const res = await api.patch(`/notes/${openNote._id}/unlock`, { pin: pinInput });
      setNotes(prev => prev.map(n => n._id === openNote._id ? res.data : n));
      setOpenNote(res.data); setPinInput(""); setPinError(""); setShowPinModal(false);
      toast.success("Note unlocked permanently");
    } catch { setPinError("Incorrect PIN"); }
  };

  // ─── TAGS ─────────────────────────────────────────────────────────────────
  const handleAddTag = (type = "create") => {
    const input = type === "create" ? tagInput : editTagInput;
    const current = type === "create" ? tags : editTags;
    const setCurrent = type === "create" ? setTags : setEditTags;
    const setInput   = type === "create" ? setTagInput : setEditTagInput;
    if (input.trim() && !current.includes(input.trim())) { setCurrent([...current, input.trim()]); setInput(""); }
  };
  const handleRemoveTag = (tag, type = "create") => {
    const setCurrent = type === "create" ? setTags : setEditTags;
    const current    = type === "create" ? tags : editTags;
    setCurrent(current.filter(t => t !== tag));
  };
  const handleTagKeyDown = (e, type = "create") => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(type); } };

  // ─── UTILS ───────────────────────────────────────────────────────────────
  const shareNote = (noteId) => {
    const link = `${window.location.origin}/share/${noteId}`;
    navigator.clipboard.writeText(link)
      .then(() => toast.success("Share link copied!"))
      .catch(() => toast.error("Could not copy link"));
  };

  const format = (command, value = null, type = "create") => {
    const editor = (type === "edit" ? editEditorRef : createEditorRef).current;
    if (!editor) return;
    editor.focus(); document.execCommand(command, false, value);
  };

  function placeCaretAtEnd(el) {
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el); range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(range);
  }

  // ─── UNDO/REDO ────────────────────────────────────────────────────────────
  const handleUndoCreate = () => {
    if (!undoStackCreate.length) return;
    const last = undoStackCreate[undoStackCreate.length - 1];
    setRedoStackCreate(p => [content, ...p]); setUndoStackCreate(p => p.slice(0, -1));
    setContent(last); if (createEditorRef.current) { createEditorRef.current.innerHTML = last; placeCaretAtEnd(createEditorRef.current); }
  };
  const handleRedoCreate = () => {
    if (!redoStackCreate.length) return;
    const next = redoStackCreate[0];
    setUndoStackCreate(p => [...p, content]); setRedoStackCreate(p => p.slice(1));
    setContent(next); if (createEditorRef.current) { createEditorRef.current.innerHTML = next; placeCaretAtEnd(createEditorRef.current); }
  };
  const handleUndoEdit = () => {
    if (!undoStackEdit.length) return;
    const last = undoStackEdit[undoStackEdit.length - 1];
    setRedoStackEdit(p => [editContent, ...p]); setUndoStackEdit(p => p.slice(0, -1));
    setEditContent(last); if (editEditorRef.current) { editEditorRef.current.innerHTML = last; placeCaretAtEnd(editEditorRef.current); }
  };
  const handleRedoEdit = () => {
    if (!redoStackEdit.length) return;
    const next = redoStackEdit[0];
    setUndoStackEdit(p => [...p, editContent]); setRedoStackEdit(p => p.slice(1));
    setEditContent(next); if (editEditorRef.current) { editEditorRef.current.innerHTML = next; placeCaretAtEnd(editEditorRef.current); }
  };

  // Find highlight
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
            if (offset > lastIndex) frag.appendChild(document.createTextNode(node.textContent.slice(lastIndex, offset)));
            const mark = document.createElement("mark");
            mark.className = "bg-yellow-300 rounded-sm"; mark.textContent = match;
            frag.appendChild(mark); lastIndex = offset + match.length;
          });
          if (lastIndex < node.textContent.length) frag.appendChild(document.createTextNode(node.textContent.slice(lastIndex)));
          node.replaceWith(frag);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) node.childNodes.forEach(highlightText);
    };
    doc.body.childNodes.forEach(highlightText);
    return DOMPurify.sanitize(doc.body.innerHTML);
  };

  // ─── SUB-COMPONENTS ──────────────────────────────────────────────────────
  const EditorToolbar = ({ type }) => (
    <div className="flex flex-wrap items-center gap-1 mb-3 p-2 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-slate-800 dark:to-slate-700/50 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm">
      <div className="flex gap-0.5 border-r border-gray-300 dark:border-slate-600 pr-2 mr-1">
        <button className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg text-gray-700 dark:text-slate-300 transition-all active:scale-95" onClick={() => format("bold", null, type)}><Bold size={15} /></button>
        <button className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg text-gray-700 dark:text-slate-300 transition-all active:scale-95" onClick={() => format("italic", null, type)}><Italic size={15} /></button>
        <button className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg text-gray-700 dark:text-slate-300 transition-all active:scale-95" onClick={() => format("underline", null, type)}><Underline size={15} /></button>
      </div>
      <div className="flex gap-0.5 border-r border-gray-300 dark:border-slate-600 pr-2 mr-1">
        <button className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg text-gray-700 dark:text-slate-300 transition-all active:scale-95" onClick={() => format("justifyLeft", null, type)}><AlignLeft size={15} /></button>
        <button className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg text-gray-700 dark:text-slate-300 transition-all active:scale-95" onClick={() => format("justifyCenter", null, type)}><AlignCenter size={15} /></button>
        <button className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg text-gray-700 dark:text-slate-300 transition-all active:scale-95" onClick={() => format("justifyRight", null, type)}><AlignRight size={15} /></button>
      </div>
      <div className="flex items-center gap-2">
        <select onChange={(e) => format("fontSize", e.target.value, type)} className="bg-white dark:bg-slate-700 dark:text-slate-200 text-xs text-gray-700 focus:outline-none cursor-pointer px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-600">
          <option value="3">Normal</option><option value="1">Small</option><option value="5">Large</option><option value="7">Huge</option>
        </select>
        <div className="relative flex items-center">
          <input type="color" className="opacity-0 w-7 h-7 cursor-pointer absolute" onChange={(e) => format("foreColor", e.target.value, type)} />
          <button type="button" className="w-7 h-7 rounded-lg border-2 border-gray-300 bg-gradient-to-br from-red-400 via-purple-400 to-blue-400 hover:scale-110 transition-transform" title="Text Color"></button>
        </div>
        <button type="button" onClick={() => triggerFileInput(type)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 rounded-lg text-gray-600 dark:text-slate-400 transition-all flex items-center gap-1">
          <Paperclip size={15} /><span className="text-xs hidden sm:inline">Attach</span>
        </button>
      </div>
    </div>
  );

  const AutoSaveIndicator = () => {
    if (autoSaveStatus === "idle")   return null;
    if (autoSaveStatus === "saving") return <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 font-medium"><Loader2 size={11} className="animate-spin" />Saving…</span>;
    return <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle2 size={11} />Saved</span>;
  };

  const ColorPickerPopover = ({ noteId }) => (
    <div
      className="absolute top-full right-0 mt-1 z-40 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 p-2 animate-in fade-in zoom-in-95 duration-150"
      onClick={e => e.stopPropagation()}
    >
      <p className="text-xs text-gray-400 dark:text-slate-500 font-medium px-1 mb-1.5">Note color</p>
      <div className="grid grid-cols-4 gap-1.5">
        {Object.entries(NOTE_COLORS).map(([key, { label, swatch }]) => (
          <button
            key={key}
            title={label}
            onClick={() => handleChangeColor(noteId, key)}
            className={`w-7 h-7 rounded-full ${swatch} hover:scale-110 transition-transform ring-2 ring-transparent hover:ring-offset-1 hover:ring-gray-400`}
          />
        ))}
      </div>
    </div>
  );

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between mb-6 sm:mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/50 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={Logo} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl shadow-lg shadow-blue-200/50 object-cover ring-2 ring-blue-100 dark:ring-blue-900" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full border-2 border-white dark:border-slate-800"></div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 dark:from-blue-300 dark:via-purple-300 dark:to-pink-300 bg-clip-text text-transparent">My Notes</h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 hidden sm:block font-medium">Capture &amp; organize beautifully</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button onClick={toggleDarkMode} className="p-2 sm:p-2.5 bg-white dark:bg-slate-700 text-slate-600 dark:text-yellow-300 hover:bg-gray-50 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 rounded-xl transition-all shadow-sm" title={darkMode ? "Light mode" : "Dark mode"}>
              {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button onClick={() => setShowCreateBox(true)} className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" /><span className="hidden sm:inline text-sm">New Note</span>
            </button>
            <button onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }} className="p-2 sm:p-2.5 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-slate-600 rounded-xl transition-all shadow-sm" title="Logout">
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* ── SEARCH + SORT ── */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input type="text" placeholder="Search notes, tags…" value={search} onChange={e => setSearch(e.target.value)}
              className="block w-full pl-11 pr-9 py-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 shadow-sm hover:shadow-md transition-all"
            />
            {search && <button onClick={() => setSearch("")} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"><X size={15} /></button>}
          </div>
          <div className="relative">
            <button onClick={e => { e.stopPropagation(); setShowSortMenu(v => !v); }}
              className="flex items-center gap-2 px-3 py-3 bg-white/90 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-600 dark:text-slate-400 hover:border-blue-300 transition-all shadow-sm">
              <ArrowUpDown size={15} />
              <span className="hidden sm:inline">{{ newest: "Newest", oldest: "Oldest", az: "A–Z", pinned: "Pinned" }[sortBy]}</span>
            </button>
            {showSortMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                {[["newest","Newest first"],["oldest","Oldest first"],["az","A – Z"],["pinned","Pinned first"]].map(([key,label]) => (
                  <button key={key} onClick={() => { setSortBy(key); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-all ${sortBy === key ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold" : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"}`}>{label}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Note count */}
        {!loading && (
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-5 pl-1 font-medium">
            {notes.length === 0 ? "No notes" : search ? `${notes.length} result${notes.length !== 1 ? "s" : ""} for "${search}"` : `${notes.length} note${notes.length !== 1 ? "s" : ""}`}
          </p>
        )}

        {/* ── CREATE MODAL ── */}
        {showCreateBox && (
          <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 animate-in fade-in duration-200">
            <div className="h-full w-full flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-900/50 sticky top-0 z-10 shadow-sm">
                <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-gray-900 to-blue-900 dark:from-blue-300 dark:to-purple-300 bg-clip-text text-transparent">Create Note</h2>
                <div className="flex gap-1 items-center">
                  <span className="hidden sm:block text-xs text-gray-400 dark:text-slate-500 mr-1">Ctrl+S</span>
                  <button onClick={handleUndoCreate} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-slate-400 transition-all active:scale-95"><Undo2 size={17} /></button>
                  <button onClick={handleRedoCreate} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-slate-400 transition-all active:scale-95"><Redo2 size={17} /></button>
                  <button onClick={() => setShowCreateToolbar(!showCreateToolbar)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-slate-400 transition-all">
                    <ChevronDown size={17} className={`transition-transform ${showCreateToolbar ? "rotate-180" : ""}`} />
                  </button>
                  <button onClick={handleCloseCreate} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 rounded-lg text-gray-400 dark:text-slate-500 transition-all"><X size={19} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col">
                <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full text-xl sm:text-2xl font-bold text-gray-800 dark:text-slate-100 placeholder-gray-300 dark:placeholder-slate-600 border-none outline-none bg-transparent mb-4" />
                {/* Tags */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                    <input type="text" placeholder="Add tags…" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => handleTagKeyDown(e,"create")}
                      className="flex-1 text-sm text-gray-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-600 border-none outline-none bg-transparent" />
                    <button onClick={() => handleAddTag("create")} className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition-all font-medium">Add</button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-medium">
                          <Hash className="w-3 h-3" />{tag}
                          <button onClick={() => handleRemoveTag(tag,"create")} className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {showCreateToolbar && <EditorToolbar type="create" />}
                <div ref={createEditorRef} contentEditable className="flex-1 w-full outline-none text-gray-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed whitespace-pre-wrap empty:before:content-[attr(placeholder)] empty:before:text-gray-300 dark:empty:before:text-slate-700 min-h-[200px]"
                  placeholder="Start writing…" suppressContentEditableWarning
                  onInput={e => { const html = e.currentTarget.innerHTML; setUndoStackCreate([...undoStackCreate, content]); setContent(html); setRedoStackCreate([]); }}></div>
              </div>
              <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-900/50 flex justify-end gap-2 sticky bottom-0">
                <button onClick={handleCloseCreate} className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 font-medium hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all border border-gray-200 dark:border-slate-700">Cancel</button>
                <button onClick={handleCreateNote} disabled={isSaving} className="px-5 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2">
                  {isSaving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : "Save Note"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── NOTES GRID ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin w-10 h-10 text-blue-500 mb-4" />
            <p className="text-gray-400 dark:text-slate-500 text-sm font-medium">Loading…</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <StickyNote className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200 mb-2">{search ? "No notes found" : "No notes yet"}</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-xs mb-8">{search ? `No notes match "${search}"` : "Start capturing your brilliant ideas"}</p>
            {!search && <button onClick={() => setShowCreateBox(true)} className="text-blue-600 dark:text-blue-400 text-sm font-semibold hover:text-blue-700 flex items-center gap-2 group">Create your first note <span className="group-hover:translate-x-1 transition-transform">→</span></button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pb-20">
            {notes.map(note => {
              const colorStyle = NOTE_COLORS[note.color || "default"]?.card || "";
              return (
                <div key={note._id} className={`relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-slate-700/60 hover:border-blue-300/70 hover:shadow-xl hover:shadow-blue-100/50 dark:hover:shadow-blue-900/20 transition-all duration-300 cursor-pointer hover:-translate-y-1 ${colorStyle} ${note.isPinned ? "ring-2 ring-orange-200/60 dark:ring-orange-700/40 shadow-lg" : "shadow-sm hover:shadow-lg"}`}>

                  {/* Header row */}
                  <div className="flex items-start justify-between p-3 sm:p-4 gap-2">
                    <div className="flex-1 min-w-0" onClick={() => {
                      if (note.isLocked) { setPinNote(note); setIsSettingPin(false); setShowPinModal(true); return; }
                      setOpenNote(note); setEditContent(note.content); setEditTags(note.tags || []); setEditTagInput(""); setUndoStackEdit([]); setRedoStackEdit([]); setShowFind(false); setFindWord("");
                    }}>
                      {note.isPinned && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40 text-orange-700 dark:text-orange-400 rounded-full text-xs font-semibold mb-2">
                          <Pin className="w-3 h-3 fill-orange-600 dark:fill-orange-400" /><span>Pinned</span>
                        </div>
                      )}
                      {editingNoteId === note._id ? (
                        <input value={editingTitle} autoFocus onClick={e => e.stopPropagation()} onChange={e => setEditingTitle(e.target.value)}
                          onBlur={() => handleUpdateTitle(note._id)} onKeyDown={e => e.key === "Enter" && handleUpdateTitle(note._id)}
                          className="w-full text-base font-bold p-1 -ml-1 border-b-2 border-blue-500 bg-transparent focus:outline-none dark:text-slate-100" />
                      ) : (
                        <h3 className={`text-base font-bold text-gray-800 dark:text-slate-100 mb-1 leading-tight truncate ${!note.title && "text-gray-400 italic"} ${note.isLocked ? "blur-sm" : ""}`}
                          onClick={e => { e.stopPropagation(); if (!note.isLocked) { setEditingNoteId(note._id); setEditingTitle(note.title || ""); } }}>
                          {note.title || "Untitled"}
                        </h3>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button onClick={e => { e.stopPropagation(); handleTogglePin(note._id); }}
                        className={`p-1.5 rounded-lg transition-all active:scale-95 ${note.isPinned ? "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400" : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:bg-orange-50 hover:text-orange-600"}`} title={note.isPinned ? "Unpin" : "Pin"}>
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      {/* Color picker button */}
                      <div className="relative">
                        <button onClick={e => { e.stopPropagation(); setShowColorPicker(showColorPicker === note._id ? null : note._id); }}
                          className={`p-1.5 rounded-lg transition-all active:scale-95 ${note.color && note.color !== "default" ? "bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-200" : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-200"}`} title="Change color">
                          <Palette className="w-3.5 h-3.5" />
                        </button>
                        {showColorPicker === note._id && <ColorPickerPopover noteId={note._id} />}
                      </div>
                      <button onClick={e => { e.stopPropagation(); handleToggleLock(note); }}
                        className={`p-1.5 rounded-lg transition-all active:scale-95 ${note.isLocked ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400" : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600"}`} title={note.isLocked ? "Unlock" : "Lock"}>
                        {note.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={e => { e.stopPropagation(); requestDeleteNote(note._id); }}
                        className="p-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all active:scale-95" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 cursor-pointer" onClick={() => {
                    if (note.isLocked) { setPinNote(note); setIsSettingPin(false); setShowPinModal(true); return; }
                    setOpenNote(note); setEditContent(note.content); setEditTags(note.tags || []); setEditTagInput(""); setUndoStackEdit([]); setRedoStackEdit([]); setShowFind(false); setFindWord("");
                  }}>
                    <p className={`text-sm text-gray-600 dark:text-slate-400 line-clamp-3 leading-relaxed ${note.isLocked ? "blur-sm select-none" : ""}`}>
                      {note.summary || note.content?.replace(/<[^>]*>/gm, "").substring(0, 150) || "Empty note"}
                    </p>
                    {/* Clickable tags */}
                    {note.tags?.length > 0 && !note.isLocked && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {note.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} onClick={e => { e.stopPropagation(); setSearch(tag); }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors" title={`Filter by #${tag}`}>
                            <Hash className="w-2.5 h-2.5" />{tag}
                          </span>
                        ))}
                        {note.tags.length > 3 && <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-full text-xs">+{note.tags.length - 3}</span>}
                      </div>
                    )}
                    {note.isLocked && <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md inline-flex"><Lock className="w-3 h-3" /><span>Locked</span></div>}
                    <div className="mt-3 text-xs text-gray-400 dark:text-slate-600">
                      {new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── EDIT MODAL ── */}
      {openNote && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 animate-in fade-in duration-200">
          <div className="h-full w-full flex flex-col overflow-hidden">

            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-900/50 sticky top-0 z-10 shadow-sm">
              <div className="flex-1 min-w-0 mr-3">
                <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-gray-900 to-blue-900 dark:from-blue-300 dark:to-purple-300 bg-clip-text text-transparent truncate">{openNote.title || "Untitled"}</h2>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-gray-400 dark:text-slate-500 hidden sm:block">{new Date(openNote.updatedAt || openNote.createdAt).toLocaleString()}</p>
                  <AutoSaveIndicator />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="hidden sm:block text-xs text-gray-400 dark:text-slate-500 mr-1">Ctrl+S</span>
                <button onClick={handleUndoEdit} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-slate-400 transition-all active:scale-95"><Undo2 size={17} /></button>
                <button onClick={handleRedoEdit} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-slate-400 transition-all active:scale-95"><Redo2 size={17} /></button>
                <button onClick={() => setShowEditToolbar(!showEditToolbar)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-500 dark:text-slate-400">
                  <ChevronDown size={17} className={`transition-transform ${showEditToolbar ? "rotate-180" : ""}`} />
                </button>
                {/* Ask AI toggle */}
                <button onClick={() => setShowAskPanel(v => !v)}
                  className={`p-2 rounded-lg transition-all active:scale-95 ${showAskPanel ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400" : "hover:bg-white dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400"}`} title="Ask AI">
                  <Sparkles size={17} />
                </button>
                {/* Options */}
                <div className="relative">
                  <button onClick={() => setShowOptions(!showOptions)} className={`p-2 rounded-lg text-gray-500 dark:text-slate-400 transition-all active:scale-95 ${showOptions ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" : "hover:bg-white dark:hover:bg-slate-700"}`}>
                    <MoreVertical size={17} />
                  </button>
                  {showOptions && (
                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <button onClick={() => { setShowFind(!showFind); setShowOptions(false); }} className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-gray-700 dark:text-slate-300 transition-all"><Search size={15} /> Find in note</button>
                      <button onClick={() => { shareNote(openNote._id); setShowOptions(false); }} className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-gray-700 dark:text-slate-300 transition-all"><Share2 size={15} /> Share</button>
                      <button onClick={() => { exportMarkdown(openNote); setShowOptions(false); }} className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-gray-700 dark:text-slate-300 transition-all"><Download size={15} /> Export Markdown</button>
                      <button onClick={() => { printNote(openNote); setShowOptions(false); }} className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-gray-700 dark:text-slate-300 transition-all"><Printer size={15} /> Print / PDF</button>
                      {openNote.isLocked && <button onClick={() => { setPinInput(""); setPinError(""); setShowPinModal(true); setShowOptions(false); }} className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-gray-700 dark:text-slate-300 transition-all"><Unlock size={15} /> Unlock</button>}
                      <div className="h-px bg-gray-100 dark:bg-slate-700" />
                      <button onClick={() => { requestDeleteNote(openNote._id); setShowOptions(false); }} className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-3 text-sm transition-all"><Trash2 size={15} /> Delete</button>
                    </div>
                  )}
                </div>
                <button onClick={() => setOpenNote(null)} className="ml-1 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 rounded-lg text-gray-400 dark:text-slate-500 transition-all"><X size={19} /></button>
              </div>
            </div>

            {/* Find bar */}
            {showFind && (
              <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-100 dark:border-yellow-800/40 flex items-center gap-3">
                <Search size={15} className="text-yellow-600 dark:text-yellow-500" />
                <input autoFocus type="text" placeholder="Find in note…"
                  className="bg-transparent border-none outline-none text-sm w-full text-yellow-900 dark:text-yellow-300 placeholder-yellow-400 dark:placeholder-yellow-700"
                  value={findWord} onChange={e => setFindWord(e.target.value)} />
                <button onClick={() => { setShowFind(false); setFindWord(""); }} className="text-yellow-600 dark:text-yellow-500 hover:text-yellow-800"><X size={13} /></button>
              </div>
            )}

            {/* Tags in edit */}
            <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                <input type="text" placeholder="Add tags…" value={editTagInput} onChange={e => setEditTagInput(e.target.value)} onKeyDown={e => handleTagKeyDown(e,"edit")}
                  className="flex-1 text-sm text-gray-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-600 border-none outline-none bg-transparent" />
                <button onClick={() => handleAddTag("edit")} className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition-all font-medium">Add</button>
              </div>
              {editTags.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-2">
                  {editTags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-medium">
                      <Hash className="w-3 h-3" />{tag}
                      <button onClick={() => handleRemoveTag(tag,"edit")} className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {showEditToolbar && <div className="p-3"><EditorToolbar type="edit" /></div>}

            {/* Editor */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 relative">
              <div ref={editEditorRef} contentEditable
                className="w-full min-h-full outline-none text-gray-700 dark:text-slate-200 text-base sm:text-lg leading-relaxed whitespace-pre-wrap"
                suppressContentEditableWarning
                onInput={e => { const html = e.currentTarget.innerHTML; setUndoStackEdit([...undoStackEdit, editContent]); setEditContent(html); setRedoStackEdit([]); triggerAutoSave(html, editTags, openNote._id); }}></div>
              {findWord.trim() && (
                <div className="absolute inset-0 px-4 sm:px-6 pb-6 pointer-events-none text-base sm:text-lg leading-relaxed whitespace-pre-wrap text-transparent z-10"
                  dangerouslySetInnerHTML={{ __html: getHighlightedContent(editContent, findWord).replace(/<mark/g, '<mark style="color:transparent; background: rgba(253,224,71,0.5);"') }} />
              )}
            </div>

            {/* ── AI Q&A PANEL ── */}
            {showAskPanel && (
              <div className="border-t border-violet-200 dark:border-violet-800/50 bg-gradient-to-br from-violet-50 to-purple-50/50 dark:from-violet-950/30 dark:to-purple-950/20 px-4 sm:px-6 py-4 animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">Ask AI about this note</span>
                  <button onClick={() => setShowAskPanel(false)} className="ml-auto text-violet-400 hover:text-violet-600 dark:hover:text-violet-300"><ChevronDown size={16} /></button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. What are the key points? What does this mean?"
                    value={askQuestion}
                    onChange={e => setAskQuestion(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !isAsking && handleAskAI()}
                    className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-violet-200 dark:border-violet-800/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/50 text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500"
                  />
                  <button
                    onClick={handleAskAI}
                    disabled={isAsking || !askQuestion.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isAsking ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {isAsking ? "Thinking…" : "Ask"}
                  </button>
                </div>
                {askAnswer && (
                  <div className="mt-3 p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-violet-100 dark:border-violet-800/40 text-sm text-gray-700 dark:text-slate-300 leading-relaxed animate-in fade-in duration-200 whitespace-pre-wrap">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Bot size={13} className="text-violet-500" />
                      <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">AI Answer</span>
                    </div>
                    {askAnswer}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-900/50 flex justify-end gap-2 sticky bottom-0">
              <button onClick={() => setOpenNote(null)} className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 font-medium hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all border border-gray-200 dark:border-slate-700">Close</button>
              <button onClick={handleUpdateContent} disabled={isSaving} className="px-5 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2">
                {isSaving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PIN MODAL ── */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="text-center mb-6">
              <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${isSettingPin ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" : "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400"}`}>
                {isSettingPin ? <Lock size={26} /> : <Unlock size={26} />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{isSettingPin ? "Set Security PIN" : "Enter PIN"}</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Keep your note secure</p>
            </div>
            <input type="password" value={pinInput} autoFocus onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (isSettingPin ? handleSubmitPin() : openNote?.isLocked ? handlePermanentUnlock() : handleSubmitPin())}
              className="w-full text-center text-xl tracking-widest border-2 border-gray-300 dark:border-slate-600 px-4 py-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-slate-700 dark:text-white font-bold"
              placeholder="••••" maxLength={6} />
            {pinError && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center py-2.5 rounded-lg mb-4 font-medium border border-red-200 dark:border-red-800/40">{pinError}</div>}
            <div className="flex gap-3">
              <button onClick={() => { setShowPinModal(false); setPinInput(""); setPinError(""); }} className="flex-1 py-2.5 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all">Cancel</button>
              {isSettingPin ? (
                <button onClick={handleSubmitPin} className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/30 active:scale-95">Set PIN</button>
              ) : openNote?.isLocked ? (
                <button onClick={handlePermanentUnlock} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/30 active:scale-95">Remove Lock</button>
              ) : (
                <button onClick={handleSubmitPin} className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/30 active:scale-95">Unlock</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE ── */}
      <ConfirmModal open={confirmModal.open} title="Delete note?" message="This note will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete" onConfirm={handleDeleteNote} onCancel={() => setConfirmModal({ open: false, noteId: null })} />

      {/* Hidden file inputs */}
      <input type="file" ref={createFileInputRef} className="hidden" onChange={e => handleFileUpload(e,"create")} />
      <input type="file" ref={editFileInputRef}   className="hidden" onChange={e => handleFileUpload(e,"edit")} />
    </div>
  );
}

export default Notes;