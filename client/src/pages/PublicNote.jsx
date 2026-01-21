import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

function PublicNote() {
  const { id } = useParams();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await api.get(`/notes/share/${id}`);
        setNote(res.data);
      } catch (err) {
        setNote(null);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!note) return <div className="p-6 text-red-500">Note not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">{note.title}</h1>

        {note.tags?.length > 0 && (
          <div className="mb-3 text-sm text-gray-500">
            Tags: {note.tags.join(", ")}
          </div>
        )}

        <div className="whitespace-pre-wrap">
          {note.content}
        </div>

        <div className="mt-6 text-xs text-gray-400">
          Created at: {new Date(note.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

export default PublicNote;
