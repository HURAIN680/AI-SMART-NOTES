import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MousePointer,
  StickyNote as StickyIcon,
  PenTool,
  Square,
  Circle,
  Users,
  UserPlus,
  Share2,
  Download,
  Trash2,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  X,
  Copy,
  Plus,
  Palette,
  Eye,
  Lock,
  MessageSquare
} from "lucide-react";
import toast from "react-hot-toast";
import { getSocket, disconnectSocket } from "../api/socket";

// Initial sticky notes on the canvas
const INITIAL_STICKIES = [
  {
    id: "s1",
    x: 120,
    y: 140,
    width: 220,
    height: 180,
    color: "#fef08a", // Yellow
    title: "🚀 Launch Goals",
    content: "• Deliver v2.0 UI dashboard\n• Add real-time canvas\n• Improve search speed",
    author: "You"
  },
  {
    id: "s2",
    x: 400,
    y: 160,
    width: 220,
    height: 180,
    color: "#fed7aa", // Orange
    title: "🎨 UI Aesthetic",
    content: "• Glassmorphic cards\n• Plus Jakarta Sans font\n• Pastel sticky notes",
    author: "Sarah"
  },
  {
    id: "s3",
    x: 680,
    y: 190,
    width: 230,
    height: 180,
    color: "#bae6fd", // Sky Blue
    title: "👥 Realtime Collab",
    content: "• Multi-cursor sync\n• Live friends invite\n• Simultaneous editing",
    author: "Alex"
  }
];

// Initial active friends / collaborators
const INITIAL_FRIENDS = [
  { id: "f1", name: "Alex Chen", email: "alex@cansaas.io", avatar: "A", color: "#3b82f6", status: "online", role: "Editor", x: 710, y: 220 },
  { id: "f2", name: "Sarah Jenkins", email: "sarah@cansaas.io", avatar: "S", color: "#ec4899", status: "online", role: "Editor", x: 420, y: 190 },
  { id: "f3", name: "David Kim", email: "david@cansaas.io", avatar: "D", color: "#10b981", status: "idle", role: "Viewer", x: 260, y: 460 }
];

export default function Canvas() {
  const navigate = useNavigate();

  // Canvas Viewport / Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Active Tool: "select" | "sticky" | "pen" | "rect" | "circle"
  const [activeTool, setActiveTool] = useState("select");
  const [penColor, setPenColor] = useState("#6366f1");
  const [penWidth] = useState(3);
  const [stickyColor] = useState("#fef08a");

  // Canvas elements
  const [stickies, setStickies] = useState(INITIAL_STICKIES);
  const [activeStickyId, setActiveStickyId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDraggingSticky, setIsDraggingSticky] = useState(false);

  // Drawing canvas layer
  const drawCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingLines, setDrawingLines] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);

  // Friends & Collaborators Modal
  const [friends, setFriends] = useState(INITIAL_FRIENDS);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newFriendEmail, setNewFriendEmail] = useState("");
  const [inviteCopied, setInviteCopied] = useState(false);

  // ── Realtime collaboration (Socket.IO) ───────────────────────────────────
  const [peers, setPeers] = useState([]); // { id, name, color }
  const [remoteCursors, setRemoteCursors] = useState({}); // id -> { x, y }
  const connectedRef = useRef(false);
  const skipBroadcastRef = useRef(false);
  const skipResetTimer = useRef(null);
  const myNameRef = useRef("You");

  // Connect to the canvas room and subscribe to realtime events
  useEffect(() => {
    const socket = getSocket();
    const roomId = new URLSearchParams(window.location.search).get("room") || "cansaas-team-collab";

    const onConnect = () => {
      connectedRef.current = true;
      socket.emit("join-room", {
        room: roomId,
        board: { stickies: INITIAL_STICKIES, lines: [] }
      });
      socket.emit("user-info", { name: myNameRef.current, color: "#6366f1" });
    };

    const onBoardState = (data) => {
      skipBroadcastRef.current = true;
      if (data.stickies) setStickies(data.stickies);
      if (data.lines) setDrawingLines(data.lines);
      clearTimeout(skipResetTimer.current);
      skipResetTimer.current = setTimeout(() => {
        skipBroadcastRef.current = false;
      }, 50);
    };

    const onPeerJoined = ({ id, name, color }) => {
      setPeers(prev => (prev.some(p => p.id === id) ? prev : [...prev, { id, name, color }]));
    };

    const onPeerList = (list) => {
      setPeers(list.filter(Boolean));
    };

    const onPeerLeft = ({ id }) => {
      setPeers(prev => prev.filter(p => p.id !== id));
      setRemoteCursors(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    };

    const onCursorUpdate = ({ id, x, y }) => {
      setRemoteCursors(prev => ({ ...prev, [id]: { x, y } }));
    };

    socket.on("connect", onConnect);
    socket.on("board-state", onBoardState);
    socket.on("peer-joined", onPeerJoined);
    socket.on("peer-list", onPeerList);
    socket.on("peer-left", onPeerLeft);
    socket.on("cursor-update", onCursorUpdate);

    return () => {
      socket.off("connect", onConnect);
      socket.off("board-state", onBoardState);
      socket.off("peer-joined", onPeerJoined);
      socket.off("peer-list", onPeerList);
      socket.off("peer-left", onPeerLeft);
      socket.off("cursor-update", onCursorUpdate);
      disconnectSocket();
    };
  }, []);

  // Broadcast full board state to collaborators whenever it changes locally
  useEffect(() => {
    if (!connectedRef.current || skipBroadcastRef.current) return;
    getSocket().emit("board-sync", { stickies, lines: drawingLines });
  }, [stickies, drawingLines]);

  // Redraw Pen strokes on canvas
  useEffect(() => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all completed lines
    [...drawingLines, ...(currentLine ? [currentLine] : [])].forEach(line => {
      if (line.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(line.points[0].x, line.points[0].y);
      for (let i = 1; i < line.points.length; i++) {
        ctx.lineTo(line.points[i].x, line.points[i].y);
      }
      ctx.stroke();
    });
  }, [drawingLines, currentLine]);

  // Handle Drawing Start
  const handleCanvasMouseDown = (e) => {
    const rect = drawCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    if (activeTool === "pen") {
      setIsDrawing(true);
      setCurrentLine({
        color: penColor,
        width: penWidth,
        points: [{ x, y }]
      });
    } else if (activeTool === "sticky") {
      // Create new sticky note where clicked
      const newSticky = {
        id: `s_${Date.now()}`,
        x: x - 100,
        y: y - 80,
        width: 220,
        height: 180,
        color: stickyColor,
        title: "💡 New Idea",
        content: "Type your notes here...",
        author: "You"
      };
      setStickies(prev => [...prev, newSticky]);
      setActiveTool("select");
      toast.success("Sticky note added!");
    } else if (activeTool === "select" && e.target === drawCanvasRef.current) {
      // Canvas panning
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isDrawing && currentLine) {
      const rect = drawCanvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      setCurrentLine(prev => ({
        ...prev,
        points: [...prev.points, { x, y }]
      }));
    } else if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    } else if (isDraggingSticky && activeStickyId) {
      const rect = drawCanvasRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - pan.x) / zoom;
      const rawY = (e.clientY - rect.top - pan.y) / zoom;
      setStickies(prev =>
        prev.map(s =>
          s.id === activeStickyId
            ? { ...s, x: rawX - dragOffset.x, y: rawY - dragOffset.y }
            : s
        )
      );
    }

    // Broadcast live cursor position to collaborators
    if (connectedRef.current) {
      const rect = drawCanvasRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - pan.x) / zoom;
      const rawY = (e.clientY - rect.top - pan.y) / zoom;
      getSocket().emit("cursor-update", { x: rawX, y: rawY });
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDrawing && currentLine) {
      setDrawingLines(prev => [...prev, currentLine]);
      setCurrentLine(null);
      setIsDrawing(false);
    }
    setIsPanning(false);
    setIsDraggingSticky(false);
  };

  // Sticky Dragging
  const handleStickyMouseDown = (e, stickyId) => {
    e.stopPropagation();
    setActiveStickyId(stickyId);
    setIsDraggingSticky(true);

    const sticky = stickies.find(s => s.id === stickyId);
    if (!sticky) return;

    const rect = drawCanvasRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - pan.x) / zoom;
    const clickY = (e.clientY - rect.top - pan.y) / zoom;

    setDragOffset({
      x: clickX - sticky.x,
      y: clickY - sticky.y
    });
  };

  // Update sticky content
  const handleUpdateSticky = (id, field, value) => {
    setStickies(prev =>
      prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  // Delete sticky
  const handleDeleteSticky = (e, id) => {
    e.stopPropagation();
    setStickies(prev => prev.filter(s => s.id !== id));
    toast.success("Sticky note removed");
  };

  // Add friend / Invite collaborator
  const handleInviteFriend = (e) => {
    e.preventDefault();
    if (!newFriendEmail.trim()) return;

    const friendName = newFriendEmail.split("@")[0] || "Friend";
    const colors = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newFriend = {
      id: `f_${Date.now()}`,
      name: friendName.charAt(0).toUpperCase() + friendName.slice(1),
      email: newFriendEmail.trim(),
      avatar: friendName.charAt(0).toUpperCase(),
      color: randomColor,
      status: "online",
      role: "Editor",
      x: 350 + Math.random() * 200,
      y: 300 + Math.random() * 150
    };

    setFriends(prev => [...prev, newFriend]);
    setNewFriendEmail("");
    toast.success(`Invited ${newFriend.name} to collaborate!`);
  };

  // Clear Canvas
  const handleClearCanvas = () => {
    if (window.confirm("Clear all sticky notes and drawings on the board?")) {
      setStickies([]);
      setDrawingLines([]);
      toast.success("Canvas cleared");
    }
  };

  // Export Canvas
  const handleExport = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `canvas-collab-${Date.now()}.png`;
    link.href = url;
    link.click();
    toast.success("Exported canvas drawing as PNG!");
  };

  const copyInviteLink = () => {
    const shareUrl = `${window.location.origin}/canvas?room=cansaas-team-collab`;
    navigator.clipboard.writeText(shareUrl);
    setInviteCopied(true);
    toast.success("Live collaboration link copied!");
    setTimeout(() => setInviteCopied(false), 2000);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans select-none relative">
      
      {/* Top Header */}
      <header className="h-14 px-4 sm:px-6 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between z-30 flex-shrink-0">
        {/* Left: Back to Notes & Canvas Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/notes")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Notes</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-750 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-base">🎨</span>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Collab Canvas Board
            </h1>
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Live Sync
            </span>
          </div>
        </div>

        {/* Center: Quick Tools */}
        <div className="hidden lg:flex items-center gap-1 p-1 bg-slate-800/80 rounded-2xl border border-slate-700/60 shadow-inner">
          <button
            onClick={() => setActiveTool("select")}
            className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
              activeTool === "select" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
            title="Select & Move"
          >
            <MousePointer className="w-4 h-4" />
            <span>Select</span>
          </button>

          <button
            onClick={() => setActiveTool("sticky")}
            className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
              activeTool === "sticky" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
            title="Add Sticky Note"
          >
            <StickyIcon className="w-4 h-4" />
            <span>Sticky</span>
          </button>

          <button
            onClick={() => setActiveTool("pen")}
            className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
              activeTool === "pen" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
            title="Freehand Pen"
          >
            <PenTool className="w-4 h-4" />
            <span>Draw</span>
          </button>
        </div>

        {/* Right: Friends & Collaborators Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Collaborator Avatar Pile */}
          <div className="flex items-center -space-x-2">
            {[...peers.map((p, i) => ({ id: `peer_${i}_${p.id}`, name: p.name, role: "Editor", status: "online", avatar: (p.name || "?")[0], color: p.color || "#6366f1" })), ...friends.slice(0, 3)].slice(0, 5).map((f) => (
              <div
                key={f.id}
                title={`${f.name} (${f.role}) - ${f.status}`}
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-bold text-xs text-white shadow-xs relative"
                style={{ backgroundColor: f.color }}
              >
                {f.avatar}
                {f.status === "online" && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white"></span>
                )}
              </div>
            ))}
          </div>

          {/* Add Friends Button */}
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Friends</span>
          </button>

          {/* Export button */}
          <button
            onClick={handleExport}
            title="Export Canvas to PNG"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Canvas Area with Grid Background */}
      <div
        className="flex-1 relative overflow-hidden bg-white cursor-crosshair"
        style={{
          backgroundImage: `radial-gradient(circle, #cdd6e2 1.2px, transparent 1.2px)`,
          backgroundSize: "28px 28px"
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
      >
        {/* Drawing HTML5 Canvas Layer */}
        <canvas
          ref={drawCanvasRef}
          width={3000}
          height={2000}
          className="absolute inset-0 pointer-events-auto"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0"
          }}
        />

        {/* Interactive Sticky Notes Layer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0"
          }}
        >
          {stickies.map((sticky) => (
            <div
              key={sticky.id}
              onMouseDown={(e) => handleStickyMouseDown(e, sticky.id)}
              style={{
                transform: `translate(${sticky.x}px, ${sticky.y}px)`,
                width: `${sticky.width}px`,
                backgroundColor: sticky.color
              }}
              className="absolute pointer-events-auto rounded-2xl p-4 shadow-xl border border-black/10 text-slate-900 group transition-shadow hover:shadow-2xl cursor-grab active:cursor-grabbing select-text"
            >
              {/* Sticky Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <input
                  type="text"
                  value={sticky.title}
                  onChange={(e) => handleUpdateSticky(sticky.id, "title", e.target.value)}
                  className="font-bold text-xs sm:text-sm bg-transparent border-none focus:outline-none w-full text-slate-900 placeholder:text-slate-600"
                />
                <button
                  onClick={(e) => handleDeleteSticky(e, sticky.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-black/10 text-slate-700 transition"
                  title="Delete Sticky"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sticky Content */}
              <textarea
                value={sticky.content}
                onChange={(e) => handleUpdateSticky(sticky.id, "content", e.target.value)}
                rows={4}
                className="w-full text-xs bg-transparent border-none focus:outline-none resize-none leading-relaxed text-slate-800 placeholder:text-slate-500"
              />

              {/* Author Badge */}
              <div className="pt-2 mt-1 border-t border-black/10 flex items-center justify-between text-[10px] text-slate-600">
                <span className="font-semibold">By: {sticky.author}</span>
                <div className="flex gap-1">
                  {["#fef08a", "#fed7aa", "#bae6fd", "#bbf7d0", "#fbcfe8"].map((c) => (
                    <button
                      key={c}
                      onClick={() => handleUpdateSticky(sticky.id, "color", c)}
                      className="w-2.5 h-2.5 rounded-full border border-black/20"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Live Real-Time Collaborator Cursors */}
          {Object.entries(remoteCursors).map(([peerId, pos]) => {
            const peer = peers.find(p => p.id === peerId);
            if (!peer) return null;
            return (
              <div
                key={peerId}
                className="absolute pointer-events-none transition-all duration-100 ease-out z-40 flex items-start gap-1"
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px)`
                }}
              >
                {/* SVG Cursor Pointer */}
                <svg
                  className="w-5 h-5 -rotate-45"
                  viewBox="0 0 24 24"
                  fill={peer.color || "#6366f1"}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                >
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                </svg>

                {/* Name Tag */}
                <div
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-md flex items-center gap-1 whitespace-nowrap"
                  style={{ backgroundColor: peer.color || "#6366f1" }}
                >
                  <span>{peer.name}</span>
                  <span className="opacity-80 text-[8px]">(online)</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Bottom Toolbar for Canvas Navigation & Tools (Mobile + Desktop) */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-1.5 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl">
          <button
            onClick={() => setActiveTool("select")}
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTool === "select" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            <MousePointer className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool("sticky")}
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTool === "sticky" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            <StickyIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool("pen")}
            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTool === "pen" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            <PenTool className="w-4 h-4" />
          </button>

          {activeTool === "pen" && (
            <div className="flex items-center gap-1 px-2 border-l border-slate-800">
              {["#6366f1", "#ef4444", "#10b981", "#f59e0b", "#ffffff"].map((c) => (
                <button
                  key={c}
                  onClick={() => setPenColor(c)}
                  className={`w-4 h-4 rounded-full border-2 transition ${
                    penColor === c ? "scale-125 border-white" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}

          <span className="w-[1px] h-5 bg-slate-800 mx-1" />

          {/* Zoom controls */}
          <button
            onClick={() => setZoom(z => Math.max(0.4, z - 0.15))}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-medium text-slate-400 px-1">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={() => setZoom(z => Math.min(2.5, z + 0.15))}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleClearCanvas}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
            title="Clear Canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Invite Friends / Collaborators Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-indigo-400">
                <Users className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">
                  Add Friends & Collaborators
                </h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Invite friends to brainstorm on this canvas in real time with live cursor sync.
            </p>

            {/* Invite Form */}
            <form onSubmit={handleInviteFriend} className="flex gap-2">
              <input
                type="email"
                required
                value={newFriendEmail}
                onChange={(e) => setNewFriendEmail(e.target.value)}
                placeholder="friend@example.com"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Invite</span>
              </button>
            </form>

            {/* Live Link Sharing */}
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-2">
              <div className="truncate text-xs text-slate-400 font-mono">
                {window.location.origin}/canvas?room=cansaas-collab
              </div>
              <button
                onClick={copyInviteLink}
                className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition flex items-center gap-1.5 flex-shrink-0"
              >
                {inviteCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{inviteCopied ? "Copied" : "Copy Link"}</span>
              </button>
            </div>

            {/* Collaborators List */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active on this Board ({friends.length + 1})
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {/* You */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                      Y
                    </div>
                    <div>
                      <p className="font-semibold text-white">You (Owner)</p>
                      <p className="text-[10px] text-slate-400">Host</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    Online
                  </span>
                </div>

                {/* Friends */}
                {friends.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs"
                        style={{ backgroundColor: f.color }}
                      >
                        {f.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{f.name}</p>
                        <p className="text-[10px] text-slate-400">{f.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-medium">{f.role}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
