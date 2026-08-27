import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Share2,
  MoreHorizontal,
  LayoutGrid,
  List as ListIcon,
  Sparkles,
  Clock,
  Menu,
  ChevronRight,
  Filter,
  Loader2,
  Bot
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import DashboardSidebar from "../components/DashboardSidebar";
import AICopilotPanel from "../components/AICopilotPanel";
import CategoryNoteSection from "../components/CategoryNoteSection";
import NoteEditorModal from "../components/NoteEditorModal";
import PinModal from "../components/PinModal";
import ConfirmModal from "../components/ConfirmModal";

// Helper for exporting to Markdown
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

export default function Notes() {
  const navigate = useNavigate();

  // Core Data
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  
  // Navigation & Workspace State
  const [activeWorkspace, setActiveWorkspace] = useState("Cansaas");
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "starred" | "archive" | "trash" | "notifications" | "settings"
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Layout Sidebars (Mobile responsive initial state)
  const [showLeftSidebar, setShowLeftSidebar] = useState(() => window.innerWidth >= 1024);
  const [showCopilot, setShowCopilot] = useState(() => window.innerWidth >= 1280);
  const [darkMode, setDarkMode] = useState(false);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeNote, setActiveNote] = useState(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalContent, setModalContent] = useState("");
  const [modalTags, setModalTags] = useState([]);
  const [modalCategory, setModalCategory] = useState("Ideas");
  const [isSaving, setIsSaving] = useState(false);

  // PIN / Lock State
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinNote, setPinNote] = useState(null);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [pinError, setPinError] = useState("");

  // Confirm Delete Modal
  const [confirmDelete, setConfirmDelete] = useState({ open: false, noteId: null });

  // User Profile
  const [userName, setUserName] = useState("Ucok");
  const [userEmail, setUserEmail] = useState("ucok@cansaas.io");

  // Handle window resize for sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowLeftSidebar(true);
      } else {
        setShowLeftSidebar(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─── INIT & EFFECTS ────────────────────────────────────────────────────────
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    const isDark = savedTheme === "dark";
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.name) setUserName(parsed.name);
        if (parsed.email) setUserEmail(parsed.email);
      }
    } catch {}

    // Fetch initial notes
    fetchNotes();
  }, []);

  // Debounced search
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchNotes(search);
    }, 300);
    return () => clearTimeout(delay);
  }, [search]);

  // ─── API CALLS ─────────────────────────────────────────────────────────────
  const fetchNotes = async (searchText = "") => {
    try {
      const res = await api.get("/notes", { params: { search: searchText } });
      setNotes(res.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      } else {
        toast.error("Failed to load notes");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  // ─── OPEN NOTE HANDLER ─────────────────────────────────────────────────────
  const handleOpenNote = (note) => {
    if (note.isLocked) {
      setPinNote(note);
      setIsSettingPin(false);
      setPinInput("");
      setPinError("");
      setShowPinModal(true);
      return;
    }

    setActiveNote(note);
    setModalTitle(note.title || "");
    setModalContent(note.content || "");
    setModalTags(note.tags || []);
    setModalCategory(determineNoteCategory(note));
    setIsEditMode(true);
    setIsEditorOpen(true);
  };

  // ─── NEW NOTE TRIGGER ──────────────────────────────────────────────────────
  const handleTriggerNewNote = (category = "Ideas") => {
    setActiveNote(null);
    setModalTitle("");
    setModalContent("");
    setModalTags([category]);
    setModalCategory(category);
    setIsEditMode(false);
    setIsEditorOpen(true);
  };

  // ─── SAVE NOTE (CREATE / UPDATE) ───────────────────────────────────────────
  const handleSaveNote = async () => {
    if (!modalContent.trim() && !modalTitle.trim()) {
      toast.error("Please add some content or title to your note");
      return;
    }

    setIsSaving(true);
    const tid = toast.loading(isEditMode ? "Updating note..." : "Saving note...");

    try {
      if (isEditMode && activeNote) {
        const res = await api.put(`/notes/${activeNote._id}`, {
          title: modalTitle,
          content: modalContent,
          tags: modalTags
        });
        setNotes(prev => prev.map(n => n._id === activeNote._id ? res.data : n));
        setActiveNote(res.data);
        toast.success("Note updated!", { id: tid });
      } else {
        const res = await api.post("/notes", {
          title: modalTitle,
          content: modalContent,
          tags: modalTags
        });
        setNotes(prev => [res.data, ...prev]);
        toast.success("Note saved!", { id: tid });
      }
      setIsEditorOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save note", { id: tid });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── PIN TOGGLE ────────────────────────────────────────────────────────────
  const handleTogglePin = async (id) => {
    try {
      const res = await api.patch(`/notes/${id}/pin`);
      setNotes(prev => prev.map(n => n._id === id ? res.data : n));
      toast.success(res.data.isPinned ? "Starred note" : "Unstarred note");
    } catch {
      toast.error("Failed to star note");
    }
  };

  // ─── LOCK / PIN PROTECTION ────────────────────────────────────────────────
  const handleLockTrigger = (note) => {
    setPinNote(note);
    setPinInput("");
    setPinError("");
    setIsSettingPin(!note.isLocked);
    setShowPinModal(true);
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (!pinInput.trim() || !pinNote) return;

    try {
      if (isSettingPin) {
        const res = await api.patch(`/notes/${pinNote._id}/lock`, { pin: pinInput });
        setNotes(prev => prev.map(n => n._id === pinNote._id ? res.data : n));
        setShowPinModal(false);
        toast.success("Note protected with PIN!");
      } else {
        const res = await api.patch(`/notes/${pinNote._id}/verify-pin`, { pin: pinInput });
        setShowPinModal(false);
        setActiveNote(res.data);
        setModalTitle(res.data.title || "");
        setModalContent(res.data.content || "");
        setModalTags(res.data.tags || []);
        setIsEditMode(true);
        setIsEditorOpen(true);
      }
    } catch (err) {
      setPinError(err.response?.data?.message || "Incorrect PIN code");
    }
  };

  // ─── DELETE NOTE ───────────────────────────────────────────────────────────
  const handleDeleteNote = async () => {
    const id = confirmDelete.noteId;
    setConfirmDelete({ open: false, noteId: null });
    try {
      await api.delete(`/notes/${id}`);
      setNotes(prev => prev.filter(n => n._id !== id));
      if (activeNote?._id === id) setActiveNote(null);
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  // ─── SHARE NOTE ────────────────────────────────────────────────────────────
  const handleShareNote = (id) => {
    const shareUrl = `${window.location.origin}/share/${id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Shareable link copied to clipboard!");
  };

  // ─── FILE UPLOAD ───────────────────────────────────────────────────────────
  const handleFileUpload = async (e, type, editorRef) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const tid = toast.loading("Uploading attachment...");
    try {
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const fileUrl = res.data.url;
      let insertHTML = "";
      if (file.type.startsWith("image/")) {
        insertHTML = `<p><img src="${fileUrl}" alt="${file.name}" class="my-2 max-w-full rounded-xl shadow-xs" /></p>`;
      } else {
        insertHTML = `<p><a href="${fileUrl}" target="_blank" class="text-indigo-600 underline font-medium">📎 ${file.name}</a></p>`;
      }
      if (editorRef.current) {
        editorRef.current.innerHTML += insertHTML;
        setModalContent(editorRef.current.innerHTML);
      }
      toast.success("File attached!", { id: tid });
    } catch {
      toast.error("Failed to upload file", { id: tid });
    }
  };

  // ─── EXPORT TO MARKDOWN ───────────────────────────────────────────────────
  const handleExportMarkdown = () => {
    if (!activeNote) return;
    const md = htmlToMarkdown(modalContent || activeNote.content || "");
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(modalTitle || activeNote.title || "note").toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded as Markdown");
  };

  // ─── CATEGORY CLASSIFICATION HELPER ───────────────────────────────────────
  function determineNoteCategory(note) {
    const text = `${note.title || ""} ${note.summary || ""} ${note.tags?.join(" ") || ""}`.toLowerCase();
    if (text.includes("research") || text.includes("culture") || text.includes("balance") || text.includes("analysis")) return "Research";
    if (text.includes("draft") || text.includes("plan") || text.includes("spec") || text.includes("todo")) return "Drafts";
    return "Ideas";
  }

  // ─── FILTER NOTES ─────────────────────────────────────────────────────────
  const filteredNotes = notes.filter(n => {
    if (activeFilter === "starred") return n.isPinned;
    if (activeFilter === "archive") return false;
    if (activeFilter === "trash") return n.isDeleted;
    if (selectedCategory) {
      return determineNoteCategory(n).toLowerCase() === selectedCategory.toLowerCase();
    }
    return true;
  });

  const ideasNotes = filteredNotes.filter(n => determineNoteCategory(n) === "Ideas");
  const researchNotes = filteredNotes.filter(n => determineNoteCategory(n) === "Research");
  const draftsNotes = filteredNotes.filter(n => determineNoteCategory(n) === "Drafts");
  const otherNotes = filteredNotes.filter(
    n => !["Ideas", "Research", "Drafts"].includes(determineNoteCategory(n))
  );

  const starredCount = notes.filter(n => n.isPinned).length;

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 flex p-0 sm:p-2.5 md:p-4 text-slate-800 dark:text-slate-100 select-none relative">
      
      {/* Outer App Frame */}
      <div className="w-full h-full flex rounded-none sm:rounded-3xl bg-white/70 dark:bg-slate-900/75 backdrop-blur-2xl border-0 sm:border border-white/60 dark:border-slate-800/80 shadow-2xl overflow-hidden relative">
        
        {/* Left Sidebar (Desktop & Mobile Drawer) */}
        <DashboardSidebar
          isOpen={showLeftSidebar}
          onClose={() => setShowLeftSidebar(false)}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          activeWorkspace={activeWorkspace}
          setActiveWorkspace={setActiveWorkspace}
          notes={notes}
          starredCount={starredCount}
          archiveCount={0}
          trashCount={0}
          notificationCount={6}
          onOpenNote={handleOpenNote}
          onNewNote={() => handleTriggerNewNote("Ideas")}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          onLogout={handleLogout}
          userName={userName}
          userEmail={userEmail}
        />

        {/* Center Canvas */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50/40 dark:bg-slate-900/40 relative">
          
          {/* Top Bar Header */}
          <header className="px-4 sm:px-8 py-3 sm:py-3.5 border-b border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between gap-2 sm:gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setShowLeftSidebar(true)}
                className="p-2 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition lg:hidden"
                title="Open Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowLeftSidebar(!showLeftSidebar)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition hidden lg:inline-flex"
                title="Toggle Sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>

              <h2 className="font-bold text-base sm:text-lg text-slate-800 dark:text-white truncate">
                {activeWorkspace}
              </h2>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              <button
                onClick={() => handleShareNote(notes[0]?._id || "")}
                className="px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Share</span>
              </button>

              {/* View Toggle (hidden on very small screens) */}
              <div className="hidden sm:flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === "list"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                  title="List View"
                >
                  <ListIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Copilot Drawer Toggle */}
              <button
                onClick={() => setShowCopilot(!showCopilot)}
                className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                  showCopilot
                    ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                }`}
                title="Toggle AI Copilot"
              >
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span className="hidden sm:inline">AI Copilot</span>
              </button>

              {/* Quick Add Note Button (Mobile visible) */}
              <button
                onClick={() => handleTriggerNewNote("Ideas")}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition"
                title="Create Note"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">New Note</span>
              </button>
            </div>
          </header>

          {/* Scrollable Center Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 space-y-6 sm:space-y-7">
            
            {/* Greeting & Search Bar */}
            <div className="space-y-3 max-w-4xl">
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Hola {userName}</span>
                  <span className="animate-bounce">👋</span>
                </h1>
              </div>

              {/* Search Bar Pill */}
              <div className="relative group">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your notes..."
                  className="w-full pl-10 sm:pl-11 pr-10 sm:pr-11 py-2.5 sm:py-3 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition"
                />
                <button
                  type="button"
                  title="Search History"
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2"
                >
                  <Clock className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Note Sections */}
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
                <p className="text-xs font-medium">Loading smart notes...</p>
              </div>
            ) : filteredNotes.length === 0 && search ? (
              <div className="text-center py-16 space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No notes found matching "<strong>{search}</strong>"
                </p>
                <button
                  onClick={() => handleTriggerNewNote("Ideas")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create note for "{search}"</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8 pb-20 sm:pb-12">
                
                {/* 1. IDEAS SECTION */}
                <CategoryNoteSection
                  title="Ideas"
                  categoryKey="Ideas"
                  color="orange"
                  notes={ideasNotes}
                  showNewNoteCard={true}
                  onNewNote={handleTriggerNewNote}
                  onOpenNote={handleOpenNote}
                  onPinNote={handleTogglePin}
                  onLockNote={handleLockTrigger}
                  onDeleteNote={(id) => setConfirmDelete({ open: true, noteId: id })}
                  onShareNote={handleShareNote}
                />

                {/* 2. RESEARCH SECTION */}
                <CategoryNoteSection
                  title="Research"
                  categoryKey="Research"
                  color="blue"
                  notes={researchNotes}
                  showNewNoteCard={false}
                  onNewNote={handleTriggerNewNote}
                  onOpenNote={handleOpenNote}
                  onPinNote={handleTogglePin}
                  onLockNote={handleLockTrigger}
                  onDeleteNote={(id) => setConfirmDelete({ open: true, noteId: id })}
                  onShareNote={handleShareNote}
                />

                {/* 3. DRAFTS SECTION */}
                <CategoryNoteSection
                  title="Drafts"
                  categoryKey="Drafts"
                  color="green"
                  notes={draftsNotes}
                  showNewNoteCard={false}
                  onNewNote={handleTriggerNewNote}
                  onOpenNote={handleOpenNote}
                  onPinNote={handleTogglePin}
                  onLockNote={handleLockTrigger}
                  onDeleteNote={(id) => setConfirmDelete({ open: true, noteId: id })}
                  onShareNote={handleShareNote}
                />

                {/* Other Notes */}
                {otherNotes.length > 0 && (
                  <CategoryNoteSection
                    title="General Notes"
                    categoryKey="General"
                    color="purple"
                    notes={otherNotes}
                    showNewNoteCard={false}
                    onNewNote={handleTriggerNewNote}
                    onOpenNote={handleOpenNote}
                    onPinNote={handleTogglePin}
                    onLockNote={handleLockTrigger}
                    onDeleteNote={(id) => setConfirmDelete({ open: true, noteId: id })}
                    onShareNote={handleShareNote}
                  />
                )}

              </div>
            )}

          </div>

          {/* Floating Action Button (FAB) on Mobile */}
          <button
            onClick={() => handleTriggerNewNote("Ideas")}
            className="sm:hidden fixed bottom-5 right-5 z-30 w-13 h-13 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform"
            title="Create Note"
          >
            <Plus className="w-6 h-6" />
          </button>
        </main>

        {/* Right AI Copilot Panel (Mobile Overlay & Desktop Drawer) */}
        <AICopilotPanel
          isOpen={showCopilot}
          onClose={() => setShowCopilot(false)}
          activeNote={activeNote}
          userName={userName}
          onCreateNoteFromAI={(noteData) => {
            setModalTitle(noteData.title);
            setModalContent(noteData.content);
            setModalTags(noteData.tags);
            setIsEditMode(false);
            setIsEditorOpen(true);
          }}
        />

      </div>

      {/* Note Editor Modal */}
      <NoteEditorModal
        isOpen={isEditorOpen}
        isEdit={isEditMode}
        note={activeNote}
        title={modalTitle}
        setTitle={setModalTitle}
        content={modalContent}
        setContent={setModalContent}
        tags={modalTags}
        setTags={setModalTags}
        category={modalCategory}
        setCategory={setModalCategory}
        onSave={handleSaveNote}
        onClose={() => setIsEditorOpen(false)}
        isSaving={isSaving}
        onFileUpload={handleFileUpload}
        onAskAI={(note) => {
          setIsEditorOpen(false);
          setShowCopilot(true);
        }}
        onExportMarkdown={handleExportMarkdown}
      />

      {/* PIN Lock/Unlock Modal */}
      <PinModal
        isOpen={showPinModal}
        isSettingPin={isSettingPin}
        pinInput={pinInput}
        setPinInput={setPinInput}
        pinError={pinError}
        onClose={() => setShowPinModal(false)}
        onSubmit={handlePinSubmit}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDelete.open}
        title="Delete Note"
        message="Are you sure you want to permanently delete this note? This action cannot be undone."
        onConfirm={handleDeleteNote}
        onCancel={() => setConfirmDelete({ open: false, noteId: null })}
      />

    </div>
  );
}