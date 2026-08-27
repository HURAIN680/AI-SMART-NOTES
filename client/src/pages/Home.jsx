import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  Sparkles,
  Zap,
  Shield,
  Cloud,
  ArrowRight,
  CheckCircle2,
  Users,
  Layout,
  Lock,
  Star,
  PenTool,
  Search,
  ChevronRight,
  Moon,
  Sun,
  Layers,
  FileText
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    const isDark = saved === "dark";
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

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

  const handleGetStarted = () => {
    if (localStorage.getItem("token")) {
      navigate("/notes");
    } else {
      navigate("/register");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans select-none overflow-x-hidden transition-colors duration-200">
      
      {/* Top Navbar */}
      <nav className="fixed top-0 inset-x-0 z-40 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-base shadow-md shadow-indigo-500/20">
              ⁕
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
              AI Smart Notes
            </span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Features</a>
            <a href="#canvas" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1.5">
              <span>Collab Canvas</span>
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">New</span>
            </a>
            <a href="#security" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Security</a>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Sign In
            </button>

            <button
              onClick={handleGetStarted}
              className="px-4 sm:px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-24 px-4 sm:px-6 max-w-7xl mx-auto text-center relative">
        {/* Glow backdrop blur orbs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl -z-10 rounded-full pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Next-Gen Smart Workspace & Collaborative Canvas</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
          Capture notes faster. <br />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            Think, organize & collaborate.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Smart notes with multi-folder workspace trees, and an infinite collaborative canvas where you can brainstorm simultaneously with friends — plus an Ask Copilot assistant for quick answers.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mb-16">
          <button
            onClick={handleGetStarted}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Open Smart Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate("/canvas")}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <PenTool className="w-4 h-4 text-indigo-500" />
            <span>Launch Canvas Whiteboard</span>
          </button>
        </div>

        {/* Dashboard Preview Window (macOS Glass Frame) */}
        <div className="relative mx-auto max-w-5xl rounded-3xl p-2 sm:p-3 bg-gradient-to-b from-white/80 via-white/50 to-white/20 dark:from-slate-800/80 dark:via-slate-900/50 dark:to-slate-950/20 backdrop-blur-2xl border border-white/60 dark:border-slate-700/60 shadow-2xl shadow-indigo-500/10">
          <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner">
            {/* macOS titlebar */}
            <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">cansaas.io — AI Smart Notes & Collab Workspace</span>
              <div className="w-12"></div>
            </div>

            {/* Preview Content Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="p-4 rounded-xl bg-slate-800/90 border border-t-[3px] border-t-orange-400 border-slate-700 space-y-2">
                <span className="text-[10px] font-bold text-orange-400 uppercase">💡 Ideas</span>
                <h4 className="font-bold text-white text-sm">Product Strategy 2026</h4>
                <p className="text-xs text-slate-400">• Optional AI summaries on demand<br />• Multi-cursor live collaboration</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/90 border border-t-[3px] border-t-sky-400 border-slate-700 space-y-2">
                <span className="text-[10px] font-bold text-sky-400 uppercase">🔍 Research</span>
                <h4 className="font-bold text-white text-sm">User Experience Studies</h4>
                <p className="text-xs text-slate-400">• 3-column Dribbble glass dashboard<br />• Fast search with real-time tags</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/90 border border-t-[3px] border-t-emerald-400 border-slate-700 space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">📝 Drafts</span>
                <h4 className="font-bold text-white text-sm">Infinite Collab Board</h4>
                <p className="text-xs text-slate-400">• Live friends cursor indicator<br />• Sticky notes & freehand drawings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="py-20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Designed for Speed, Privacy & Collaboration
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Everything you need to capture inspiration, organize projects, and brainstorm with your team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1: Optional AI */}
            <div className="p-7 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:shadow-xl hover:-translate-y-1 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Ask Copilot Assistant
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Ask questions and get instant answers grounded in your notes whenever you need a hand.
              </p>
            </div>

            {/* Feature 2: Infinite Collab Canvas */}
            <div id="canvas" className="p-7 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:shadow-xl hover:-translate-y-1 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Simultaneous Collab Canvas
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Add friends and brainstorm together on a live freeform canvas with colorful sticky notes, freehand drawing, and live cursor indicators.
              </p>
            </div>

            {/* Feature 3: Security & PIN */}
            <div id="security" className="p-7 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:shadow-xl hover:-translate-y-1 transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                PIN Code Note Locking
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Protect sensitive ideas, passwords, and private reflections with custom numerical PIN encryption and secure instant locking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">AI Smart Notes</span>
            <span>— Intelligent Workspace & Collab Canvas</span>
          </div>
          <p>© 2026 AI Smart Notes. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
