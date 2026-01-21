import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

function SharedNote() {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/notes/share/${id}`)
      .then((res) => setNote(res.data))
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load note");
      });
  }, [id]);

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {error}
      </div>
    );
  if (!note)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-10 px-4">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 border-b pb-2">
          {note.title || "Untitled"}
        </h1>

        {/* Content */}
        <div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Content</h2>
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {note.content}
          </p>
        </div>

        {/* Summary */}
        {note.summary && (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Summary</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {note.summary}
            </p>
          </div>
        )}

        {/* Tags */}
        {note.tags?.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Created At */}
        <p className="text-gray-500 text-sm text-right">
          Created on {new Date(note.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default SharedNote;
