const rooms = new Map();

export function initCanvasSocket(io) {
  io.on("connection", (socket) => {
    // A client joins a board room, bringing its initial board state
    socket.on("join-room", ({ room, board }) => {
      if (!room) return;
      socket.join(room);
      socket.data.room = room;

      // First user to create the room seeds its initial state
      if (!rooms.has(room)) {
        rooms.set(room, {
          stickies: board?.stickies ?? [],
          lines: board?.lines ?? [],
          users: {}
        });
      }

      const state = rooms.get(room);
      socket.emit("board-state", {
        room,
        stickies: state.stickies,
        lines: state.lines
      });

      // Announce the new peer to everyone else in the room
      socket.to(room).emit("peer-join", { id: socket.id });
      // Tell this peer who is already inside
      socket.emit("peer-list", Object.keys(state.users).map((id) => ({
        id,
        name: state.users[id].name,
        color: state.users[id].color
      })));
      state.users[socket.id] = { name: "Guest", color: "#6366f1" };
    });

    // A user registered their identity (name/color) for presence display
    socket.on("user-info", ({ name, color }) => {
      const room = socket.data.room;
      if (!room || !rooms.has(room)) return;
      rooms.get(room).users[socket.id] = { name, color };
      io.to(room).emit("peer-joined", { id: socket.id, name, color });
    });

    // Realtime cursor movement
    socket.on("cursor-update", (pos) => {
      const room = socket.data.room;
      if (room) socket.to(room).emit("cursor-update", { id: socket.id, ...pos });
    });

    // Full authoritative board state sync
    socket.on("board-sync", ({ stickies, lines }) => {
      const room = socket.data.room;
      if (!room) return;
      rooms.set(room, { stickies, lines, users: rooms.get(room).users });
      // Broadcast to other collaborators only (sender already has the state)
      socket.to(room).emit("board-state", { stickies, lines });
    });

    socket.on("disconnect", () => {
      const room = socket.data.room;
      if (room) {
        io.to(room).emit("peer-left", { id: socket.id });
        const state = rooms.get(room);
        if (state && state.users) delete state.users[socket.id];
      }
    });
  });
}

export default initCanvasSocket;