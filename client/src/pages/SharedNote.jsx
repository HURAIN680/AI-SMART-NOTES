import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { FileText, Tag, Calendar, Share2 } from "lucide-react";

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load Note</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );

  if (!note)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">Loading your note...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <div className="flex items-center gap-3 mb-2">
              <Share2 className="w-6 h-6 text-white" />
              <span className="text-sm font-medium text-indigo-100">Shared Note</span>
            </div>
            <h1 className="text-4xl font-bold text-white">
              {note.title || "Untitled Note"}
            </h1>
          </div>

          {/* Main Content */}
          <div className="px-8 py-8">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-800">Content</h2>
              </div>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            </div>

            {/* Summary Section */}
            {note.summary && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 mb-8 border border-amber-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  Summary
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {note.summary}
                </p>
              </div>
            )}

            {/* Tags Section */}
            {note.tags?.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-gray-800">Tags</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {note.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-shadow"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-2 text-sm text-gray-500 pt-6 border-t border-gray-200">
              <Calendar className="w-4 h-4" />
              <span>
                Created on {new Date(note.createdAt).toLocaleString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Badge */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            This note has been shared with you
          </p>
        </div>
      </div>
    </div>
  );
}

export default SharedNote;