

import express from 'express';
import cors from 'cors';
import authRoutes from '../src/routes/auth.routes.js';
import noteRoutes from '../src/routes/note.routes.js';
import uploadRoutes from '../src/routes/upload.routes.js';


const app = express();

app.use(cors());
app.use(express.json());

// ── Health-check endpoint ──────────────────────────────────────────────────
// Registered BEFORE all other routes.
// No auth, no MongoDB, no AI — responds instantly.
// Used by external services (e.g. UptimeRobot / cron-job.org) to keep the
// Render instance warm and prevent cold-start delays.
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
// ──────────────────────────────────────────────────────────────────────────

// Define your routes here
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/upload", uploadRoutes);


app.get('/', (req, res) => {
        res.send('backend is running');
});

export default app;
