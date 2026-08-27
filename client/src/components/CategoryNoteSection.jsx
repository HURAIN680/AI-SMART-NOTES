import React from "react";
import { Plus } from "lucide-react";
import NoteCard from "./NoteCard";

export default function CategoryNoteSection({
  title,
  categoryKey,
  color = "orange",
  notes = [],
  showNewNoteCard = false,
  onNewNote,
  onOpenNote,
  onPinNote,
  onLockNote,
  onDeleteNote,
  onShareNote,
  onColorChange,
  showColorPicker,
  setShowColorPicker
}) {
  // Dot indicator styling
  const indicatorColorMap = {
    orange: "border-orange-500 text-orange-500",
    blue: "border-sky-500 text-sky-500",
    green: "border-emerald-500 text-emerald-500",
    purple: "border-purple-500 text-purple-500",
    pink: "border-pink-500 text-pink-500"
  };

  const ringStyle = indicatorColorMap[color] || indicatorColorMap.orange;

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`w-3.5 h-3.5 rounded-full border-2 ${ringStyle} inline-block flex-shrink-0`} />
          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            {title}
          </h3>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {notes.length}
          </span>
        </div>

        <button
          onClick={() => onNewNote(categoryKey)}
          title={`Add note to ${title}`}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* + New Note Placeholder Card (Dribbble Design) */}
        {showNewNoteCard && (
          <button
            onClick={() => onNewNote(categoryKey)}
            className="group flex flex-col items-center justify-center min-h-[170px] p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500/80 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all duration-200 cursor-pointer text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <div className="flex items-center gap-2 font-medium text-sm">
              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>New note</span>
            </div>
          </button>
        )}

        {notes.map((note) => (
          <NoteCard
            key={note._id}
            note={note}
            categoryColor={color}
            onOpen={onOpenNote}
            onPin={onPinNote}
            onLock={onLockNote}
            onDelete={onDeleteNote}
            onShare={onShareNote}
            onColorChange={onColorChange}
            showColorPicker={showColorPicker}
            setShowColorPicker={setShowColorPicker}
          />
        ))}
      </div>
    </section>
  );
}
