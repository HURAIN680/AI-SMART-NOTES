import { useState } from "react";

function NoteCard({ note, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(note.content);

  const handleSave = () => {
    if (!content.trim()) return;
    onUpdate(note._id, content);
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4">
      <h3 className="font-semibold text-lg mb-1">{note.title || "Untitled"}</h3>

      {!isEditing ? (
        <p className="text-gray-700 dark:text-gray-200 mb-2">{note.content}</p>
      ) : (
        <textarea
          className="w-full p-2 border rounded mb-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          rows="3"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      )}

      {note.summary && !isEditing && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
          <strong>Summary:</strong> {note.summary}
        </p>
      )}

      {note.tags?.length > 0 && !isEditing && (
        <div className="flex flex-wrap gap-2 mb-3">
          {note.tags.map((tag, index) => (
            <span key={index} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-800 dark:text-gray-200">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-4 text-sm">
        {!isEditing ? (
          <>
            <button onClick={() => setIsEditing(true)} className="text-blue-600 dark:text-blue-400 hover:underline">
              Edit
            </button>
            <button onClick={() => onDelete(note._id)} className="text-red-600 hover:underline">
              Delete
            </button>
          </>
        ) : (
          <>
            <button onClick={handleSave} className="text-green-600 hover:underline">
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setContent(note.content);
              }}
              className="text-gray-600 dark:text-gray-300 hover:underline"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default NoteCard;