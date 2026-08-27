import React, { useState } from "react";
import {
  Star,
  Archive,
  Trash2,
  Bell,
  Settings,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Plus,
  Compass,
  Moon,
  Sun,
  LogOut,
  Sparkles,
  Layers,
  CheckCircle2,
  X
} from "lucide-react";

export default function DashboardSidebar({
  isOpen,
  onClose,
  activeFilter,
  setActiveFilter,
  selectedCategory,
  setSelectedCategory,
  activeWorkspace,
  setActiveWorkspace,
  notes = [],
  starredCount = 0,
  archiveCount = 0,
  trashCount = 0,
  notificationCount = 6,
  onOpenNote,
  onNewNote,
  darkMode,
  toggleDarkMode,
  onLogout,
  userName = "Ucok",
  userEmail = "user@example.com"
}) {
  // Folders expansion state
  const [expandedFolders, setExpandedFolders] = useState({
    Marketing: true,
    Gardening: true,
    SocialMedia: false
  });

  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  // Recent notes (first 5-6 newest notes)
  const recentNotes = notes.slice(0, 6);

  const handleItemClick = (callback) => {
    if (callback) callback();
    // On small screens, close the sidebar when an item is selected
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto w-72 lg:w-64 xl:w-72 flex-shrink-0 h-full flex flex-col bg-white/95 dark:bg-slate-900/95 lg:bg-white/80 lg:dark:bg-slate-900/85 backdrop-blur-2xl lg:backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 select-none text-slate-700 dark:text-slate-200 transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Bar */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={toggleDarkMode}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition ml-1"
              title="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Nav Tree */}
        <div className="flex-1 overflow-y-auto px-3.5 py-2 space-y-5">
          {/* Quick Nav Links */}
          <div className="space-y-0.5">
            <button
              onClick={() => handleItemClick(() => { setActiveFilter("starred"); setSelectedCategory(null); })}
              className={`w-full flex items-center justify-between px-3 py-2.5 lg:py-2 rounded-xl text-sm font-medium transition ${
                activeFilter === "starred"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>Starred</span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono font-medium">
                {starredCount}
              </span>
            </button>

            <button
              onClick={() => handleItemClick(() => { setActiveFilter("archive"); setSelectedCategory(null); })}
              className={`w-full flex items-center justify-between px-3 py-2.5 lg:py-2 rounded-xl text-sm font-medium transition ${
                activeFilter === "archive"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Archive className="w-4 h-4 text-slate-500" />
                <span>Archive</span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono font-medium">
                {archiveCount}
              </span>
            </button>

            <button
              onClick={() => handleItemClick(() => { setActiveFilter("trash"); setSelectedCategory(null); })}
              className={`w-full flex items-center justify-between px-3 py-2.5 lg:py-2 rounded-xl text-sm font-medium transition ${
                activeFilter === "trash"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4 text-slate-500" />
                <span>Trash</span>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono font-medium">
                {trashCount}
              </span>
            </button>

            <div className="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800/60 my-1"></div>

            <button
              onClick={() => handleItemClick(() => setActiveFilter("notifications"))}
              className={`w-full flex items-center justify-between px-3 py-2.5 lg:py-2 rounded-xl text-sm font-medium transition ${
                activeFilter === "notifications"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-slate-500" />
                <span>Notifications</span>
              </div>
              {notificationCount > 0 && (
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white shadow-xs">
                  {notificationCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleItemClick(() => setActiveFilter("settings"))}
              className={`w-full flex items-center justify-between px-3 py-2.5 lg:py-2 rounded-xl text-sm font-medium transition ${
                activeFilter === "settings"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Settings</span>
              </div>
            </button>

            <a
              href="/canvas"
              className="w-full flex items-center justify-between px-3 py-2.5 lg:py-2 rounded-xl text-sm font-medium transition bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:from-indigo-500/20 hover:to-purple-500/20"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm">🎨</span>
                <span className="font-semibold">Canvas Board</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold">
                Live Collab
              </span>
            </a>
          </div>

          {/* Workspace section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Workspace
              </span>
            </div>

            <div className="space-y-0.5">
              {/* Primary Workspace: Cansaas */}
              <button
                onClick={() => handleItemClick(() => { setActiveWorkspace("Cansaas"); setActiveFilter("all"); setSelectedCategory(null); })}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                  activeWorkspace === "Cansaas" && activeFilter === "all" && !selectedCategory
                    ? "bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                  ⁕
                </div>
                <span className="truncate">Cansaas</span>
              </button>

              {/* Folder: Marketing */}
              <div>
                <div
                  onClick={() => toggleFolder("Marketing")}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {expandedFolders.Marketing ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span className="text-base">📅</span>
                    <span className="text-sm font-medium">Marketing</span>
                  </div>
                </div>

                {expandedFolders.Marketing && (
                  <div className="ml-6 pl-2 border-l border-slate-200 dark:border-slate-800 space-y-0.5 mt-0.5">
                    <button
                      onClick={() => handleItemClick(() => { setSelectedCategory("Ideas"); setActiveFilter("all"); })}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition ${
                        selectedCategory === "Ideas"
                          ? "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-semibold"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/30 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span className="truncate">Branding Plan</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Folder: Gardening */}
              <div>
                <div
                  onClick={() => toggleFolder("Gardening")}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {expandedFolders.Gardening ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span className="text-base">🪴</span>
                    <span className="text-sm font-medium">Gardening</span>
                  </div>
                </div>

                {expandedFolders.Gardening && (
                  <div className="ml-6 pl-2 border-l border-slate-200 dark:border-slate-800 space-y-0.5 mt-0.5">
                    <button
                      onClick={() => handleItemClick(() => { setSelectedCategory("Research"); setActiveFilter("all"); })}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span className="truncate">Monthly Care</span>
                      </div>
                      <Star className="w-3 h-3 text-amber-500 fill-amber-400 flex-shrink-0" />
                    </button>

                    <button
                      onClick={() => handleItemClick(() => { setSelectedCategory("Drafts"); setActiveFilter("all"); })}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span className="truncate">Plant Journal</span>
                      </div>
                      <Star className="w-3 h-3 text-amber-500 fill-amber-400 flex-shrink-0" />
                    </button>

                    <button
                      onClick={() => handleItemClick(() => { setActiveFilter("all"); setSelectedCategory(null); })}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span className="truncate">Harvest Log</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Folder: Social Media */}
              <div>
                <div
                  onClick={() => toggleFolder("SocialMedia")}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {expandedFolders.SocialMedia ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span className="text-base">💬</span>
                    <span className="text-sm font-medium">Social Media</span>
                  </div>
                </div>
              </div>

              {/* Browse All */}
              <button
                onClick={() => handleItemClick(() => { setActiveFilter("all"); setSelectedCategory(null); })}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Browse All</span>
              </button>

              {/* + New Workspace */}
              <button
                onClick={() => handleItemClick(onNewNote)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New workspace</span>
              </button>
            </div>
          </div>

          {/* Recent Notes Section */}
          <div>
            <div className="px-3 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Recent Notes
              </span>
            </div>

            <div className="space-y-1">
              {recentNotes.length === 0 ? (
                <p className="px-3 py-1 text-xs text-slate-400 italic">No notes yet</p>
              ) : (
                recentNotes.map((note) => (
                  <button
                    key={note._id}
                    onClick={() => handleItemClick(() => onOpenNote(note))}
                    className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition group"
                  >
                    <span className="truncate pr-2">
                      {note.title || "Untitled Note"}
                    </span>
                    {note.isPinned && (
                      <Star className="w-3 h-3 text-amber-500 fill-amber-400 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* User profile & Logout footer */}
        <div className="p-3.5 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-semibold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {userName || "User"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {userEmail}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Log out"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
