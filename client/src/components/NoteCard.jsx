import React, { useState } from "react";
import {
  MoreVertical,
  Pin,
  Lock,
  Unlock,
  Trash2,
  Share2,
  Palette,
  Star,
  FileText
} from "lucide-react";

// Format relative time like "2 minutes ago", "3 hours ago", "1 day ago"
export function formatRelativeTime(dateString) {
  if (!dateString) return "just now";
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
}

// Convert HTML content into clean preview text or bullet points
function extractPreview(html, summary) {
  if (summary) return { text: summary, bullets: [] };
  if (!html) return { text: "", bullets: [] };

  const div = document.createElement("div");
  div.innerHTML = html;

  const liNodes = div.querySelectorAll("li");
  if (liNodes.length > 0) {
    const bullets = Array.from(liNodes).slice(0, 3).map(li => li.textContent.trim());
    return { text: "", bullets };
  }

  const rawText = div.textContent || "";
  return { text: rawText.slice(0, 160), bullets: [] };
}

export default function NoteCard({
  note,
  categoryColor = "orange",
  onOpen,
  onPin,
  onLock,
  onDelete,
  onShare,
  onColorChange,
  showColorPicker,
  setShowColorPicker
}) {
  const [showMenu, setShowMenu] = useState(false);

  const isLocked = note.isLocked;
  const preview = extractPreview(note.content, note.summary);

  // Determine accent color
  const accentBorderMap = {
    orange: "border-t-[3px] border-t-orange-400",
    blue: "border-t-[3px] border-t-sky-500",
    green: "border-t-[3px] border-t-emerald-500",
    purple: "border-t-[3px] border-t-purple-500",
    pink: "border-t-[3px] border-t-pink-500"
  };

  const borderClass = accentBorderMap[categoryColor] || accentBorderMap.orange;

  return (
    <div
      onClick={() => onOpen(note)}
      className={`group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/60 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer min-h-[170px] ${borderClass}`}
    >
      <div>
        {/* Title & Icons */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {note.title || "Untitled Note"}
          </h4>

          {note.isPinned && (
            <Star className="w-4 h-4 text-amber-500 fill-amber-400 flex-shrink-0" />
          )}
        </div>

        {/* Note Body / Preview */}
        {isLocked ? (
          <div className="flex items-center gap-2 py-3 text-slate-400 dark:text-slate-500 text-xs">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Locked note • Click to view</span>
          </div>
        ) : (
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 line-clamp-4">
            {preview.bullets.length > 0 ? (
              <ul className="space-y-1">
                {preview.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-slate-400">•</span>
                    <span className="truncate">{b}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="leading-relaxed whitespace-pre-line">
                {preview.text || "Empty note"}
              </p>
            )}
          </div>
        )}

        {/* Tags if any */}
        {note.tags && note.tags.length > 0 && !isLocked && (
          <div className="flex flex-wrap gap-1 mt-3">
            {note.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 text-[10px] font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
        <span className="text-[11px] font-medium">
          {formatRelativeTime(note.updatedAt || note.createdAt)}
        </span>

        {/* 3 dots menu */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 bottom-full mb-1 w-36 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-30 text-xs text-slate-700 dark:text-slate-200">
              <button
                onClick={() => { setShowMenu(false); onPin(note._id); }}
                className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>{note.isPinned ? "Unstar" : "Star"}</span>
              </button>

              <button
                onClick={() => { setShowMenu(false); onLock(note); }}
                className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                {note.isLocked ? <Unlock className="w-3.5 h-3.5 text-indigo-500" /> : <Lock className="w-3.5 h-3.5 text-indigo-500" />}
                <span>{note.isLocked ? "Unlock" : "Lock PIN"}</span>
              </button>

              <button
                onClick={() => { setShowMenu(false); onShare(note._id); }}
                className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <Share2 className="w-3.5 h-3.5 text-sky-500" />
                <span>Share Note</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

              <button
                onClick={() => { setShowMenu(false); onDelete(note._id); }}
                className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
