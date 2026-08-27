import React, { useRef, useEffect, useState } from "react";
import {
  X,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Paperclip,
  Download,
  Printer,
  Tag,
  Loader2,
  Check,
  Star,
  Lock
} from "lucide-react";
import toast from "react-hot-toast";

// Helper for rich text formatting
function formatDoc(command, value = null) {
  document.execCommand(command, false, value);
}

export default function NoteEditorModal({
  isOpen,
  isEdit = false,
  note = null,
  title,
  setTitle,
  content,
  setContent,
  tags = [],
  setTags,
  category = "Ideas",
  setCategory,
  onSave,
  onClose,
  isSaving = false,
  onFileUpload,
  onAskAI,
  onExportMarkdown
}) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (isOpen && editorRef.current) {
      editorRef.current.innerHTML = content || "";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEditorInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, "");
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handlePrint = () => {
    const printWin = window.open("", "_blank");
    printWin.document.write(`
      <html>
        <head>
          <title>${title || "Note"}</title>
          <style>
            body { font-family: sans-serif; padding: 2rem; max-width: 800px; margin: auto; }
            h1 { font-size: 2rem; margin-bottom: 1rem; }
            .content { line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>${title || "Untitled Note"}</h1>
          <div class="content">${content}</div>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.print();
  };

  const handleSaveClick = () => {
    if (onSave) {
      onSave();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[92vh] flex flex-col rounded-none sm:rounded-3xl bg-white dark:bg-slate-900 border-0 sm:border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Modal Top Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 truncate">
              {isEdit ? "Edit Note" : "New Note"}
            </span>

            {/* Category selection badge */}
            <select
              value={category}
              onChange={(e) => setCategory && setCategory(e.target.value)}
              className="text-xs font-semibold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Ideas">💡 Ideas</option>
              <option value="Research">🔍 Research</option>
              <option value="Drafts">📝 Drafts</option>
              <option value="Marketing">📅 Marketing</option>
              <option value="Gardening">🪴 Gardening</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            {isEdit && (
              <>
                <button
                  onClick={onExportMarkdown}
                  title="Export to Markdown"
                  className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={handlePrint}
                  title="Print Note"
                  className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition hidden sm:inline-flex"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Title Input */}
        <div className="px-4 sm:px-6 pt-4 pb-2 flex-shrink-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="w-full text-lg sm:text-2xl font-bold bg-transparent border-none focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-900 dark:text-white"
          />
        </div>

        {/* Rich Text Toolbar (horizontally scrollable on mobile) */}
        <div className="px-3 sm:px-6 py-2 border-y border-slate-100 dark:border-slate-800/80 flex items-center gap-1 text-slate-600 dark:text-slate-300 text-xs bg-slate-50/50 dark:bg-slate-900/40 overflow-x-auto whitespace-nowrap flex-shrink-0">
          <button
            type="button"
            onClick={() => formatDoc("bold")}
            title="Bold"
            className="p-2 rounded-md hover:bg-slate-200/70 dark:hover:bg-slate-700 transition"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => formatDoc("italic")}
            title="Italic"
            className="p-2 rounded-md hover:bg-slate-200/70 dark:hover:bg-slate-700 transition"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => formatDoc("underline")}
            title="Underline"
            className="p-2 rounded-md hover:bg-slate-200/70 dark:hover:bg-slate-700 transition"
          >
            <Underline className="w-4 h-4" />
          </button>

          <span className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1 flex-shrink-0" />

          <button
            type="button"
            onClick={() => formatDoc("justifyLeft")}
            title="Align Left"
            className="p-2 rounded-md hover:bg-slate-200/70 dark:hover:bg-slate-700 transition"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => formatDoc("justifyCenter")}
            title="Align Center"
            className="p-2 rounded-md hover:bg-slate-200/70 dark:hover:bg-slate-700 transition"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => formatDoc("justifyRight")}
            title="Align Right"
            className="p-2 rounded-md hover:bg-slate-200/70 dark:hover:bg-slate-700 transition"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <span className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1 flex-shrink-0" />

          <button
            type="button"
            onClick={() => formatDoc("insertUnorderedList")}
            title="Bullet List"
            className="p-2 rounded-md hover:bg-slate-200/70 dark:hover:bg-slate-700 transition"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => formatDoc("insertOrderedList")}
            title="Numbered List"
            className="p-2 rounded-md hover:bg-slate-200/70 dark:hover:bg-slate-700 transition"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <span className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1 flex-shrink-0" />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach Image or PDF"
            className="p-2 rounded-md hover:bg-slate-200/70 dark:hover:bg-slate-700 transition flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-white"
          >
            <Paperclip className="w-4 h-4" />
            <span className="text-xs font-medium">Attach</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => onFileUpload && onFileUpload(e, isEdit ? "edit" : "create", editorRef)}
            className="hidden"
            accept="image/*,application/pdf"
          />
        </div>

        {/* Contenteditable Rich Text Editor */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-[160px]">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            className="note-editor-content min-h-[150px] text-sm sm:text-base text-slate-700 dark:text-slate-200 focus:outline-none leading-relaxed"
            data-placeholder="Start typing your note..."
          />
        </div>

        {/* Tags Section */}
        <div className="px-4 sm:px-6 py-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/30 flex flex-wrap items-center gap-1.5 flex-shrink-0">
          <Tag className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          {tags.map((t, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-medium border border-indigo-100 dark:border-indigo-900/50"
            >
              #{t}
              <button
                type="button"
                onClick={() => handleRemoveTag(t)}
                className="hover:text-rose-500 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Add tag (Enter)..."
            className="text-xs bg-transparent border-none focus:outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400 min-w-[110px]"
          />
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 flex-shrink-0 gap-2">
          <div className="text-xs text-slate-400">
            <span>Press Save to store note</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveClick}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 transition"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEdit ? "Update Note" : "Save Note"}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
