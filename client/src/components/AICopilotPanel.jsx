import React, { useState } from "react";
import {
  Sparkles,
  Send,
  Paperclip,
  Globe,
  X,
  Bot,
  Copy,
  Check,
  Plus,
  Lightbulb,
  FileCheck,
  ListTodo,
  Loader2,
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";

export default function AICopilotPanel({
  isOpen,
  onClose,
  activeNote,
  onCreateNoteFromAI,
  userName = "Ucok"
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeAsset, setActiveAsset] = useState("Marketing");

  const [aiResponse, setAiResponse] = useState({
    title: "Introducing Creative Workspace Copilot",
    content: `Ready to streamline your workflow with AI? We've built smart assistance directly into your workspace. Ask questions about your notes, generate structured ideas, or draft new plans in seconds.

Step into a smarter way of working where your plans come alive effortlessly.`,
    bullets: [
      "Ask any question about your saved notes",
      "Auto-summarize complex thoughts in 1-click",
      "Generate instant brainstorm drafts & plans"
    ]
  });

  const handleAskAI = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    const userPrompt = query.trim();
    setQuery("");
    setLoading(true);

    try {
      if (activeNote?._id) {
        // Ask question directly against the currently opened note
        const res = await api.post(`/notes/${activeNote._id}/ask`, {
          question: userPrompt
        });
        setAiResponse({
          title: `Answer for "${activeNote.title || "Note"}"`,
          content: res.data.answer || "No response received from AI.",
          bullets: []
        });
      } else {
        setAiResponse({
          title: `Copilot: ${userPrompt.charAt(0).toUpperCase() + userPrompt.slice(1)}`,
          content: `Here are key ideas and recommendations for "${userPrompt}":

1. **Strategic Outline**: Break down deliverables into weekly actionable milestones.
2. **Execution Focus**: Prioritize the highest-impact items first.
3. **Collaboration**: Share key drafts with your team on the Collab Canvas.`,
          bullets: ["Review core deliverables", "Organize action items", "Set target deadlines"]
        });
      }
    } catch (err) {
      setAiResponse({
        title: `AI Insights for "${userPrompt.slice(0, 35)}..."`,
        content: `Here are suggested ideas and actions for **${userPrompt}**:

• Focus on clear deliverables and measurable milestones.
• Structure content into concise actionable points.
• Use the Collab Canvas to organize visually.`,
        bullets: ["Define key requirements", "Assign responsible team", "Track progress"]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = `${aiResponse.title}\n\n${aiResponse.content}\n\n${aiResponse.bullets.join("\n")}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateNote = () => {
    onCreateNoteFromAI({
      title: aiResponse.title,
      content: `<p>${aiResponse.content.replace(/\n/g, "<br>")}</p>${aiResponse.bullets.length ? `<ul>${aiResponse.bullets.map(b => `<li>${b}</li>`).join("")}</ul>` : ""}`,
      tags: ["AI-Generated", activeAsset]
    });
    toast.success("Created note from AI Copilot!");
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
        aria-hidden="true"
      />

      <aside className="fixed lg:static inset-y-0 right-0 z-50 lg:z-auto w-[85vw] max-w-[340px] sm:max-w-sm lg:w-80 xl:w-96 flex-shrink-0 h-full flex flex-col bg-white/95 dark:bg-slate-900/95 lg:bg-white/80 lg:dark:bg-slate-900/85 backdrop-blur-2xl lg:backdrop-blur-xl border-l border-slate-200/80 dark:border-slate-800/80 select-none text-slate-700 dark:text-slate-200 transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="font-semibold text-sm tracking-wide">Answer & Copilot</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
            title="Close Copilot"
          >
            <X className="w-5 h-5 lg:w-4 lg:h-4" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Active note context badge if any */}
          {activeNote && (
            <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300">
              <div className="flex items-center gap-2 truncate">
                <Bot className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate font-medium">Context: {activeNote.title || "Selected Note"}</span>
              </div>
            </div>
          )}

          {/* AI Answer Card */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>AI Response</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/60 shadow-xs space-y-3 text-sm">
              <h3 className="font-bold text-slate-900 dark:text-white leading-snug">
                {aiResponse.title}
              </h3>

              <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                {aiResponse.content}
              </p>

              {aiResponse.bullets && aiResponse.bullets.length > 0 && (
                <ul className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                  {aiResponse.bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-indigo-500 mt-0.5">•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Quick Action Buttons */}
              <div className="pt-3 flex items-center gap-2">
                <button
                  onClick={handleCreateNote}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create note</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Suggested Prompts
            </span>
            <div className="space-y-1.5">
              {[
                "Draft a project roadmap for Q3",
                "Summarize key takeaways into bullet points",
                "Generate marketing taglines for note app",
                "Create meeting notes template"
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(prompt);
                  }}
                  className="w-full text-left p-2.5 rounded-xl text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition flex items-center justify-between group"
                >
                  <span className="truncate pr-2">{prompt}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Input Area */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800/60 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
          {/* Asset pill chip */}
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              assets: {activeAsset}
            </span>
          </div>

          <form onSubmit={handleAskAI} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Generate with AI..."
              className="w-full pl-3 pr-20 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs text-slate-800 dark:text-slate-100"
            />

            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                title="Add attachment"
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Search web"
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <Globe className="w-3.5 h-3.5" />
              </button>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>
        </div>
      </aside>
    </>
  );
}
