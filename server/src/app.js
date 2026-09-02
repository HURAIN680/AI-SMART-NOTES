
import express from 'express';
import cors from 'cors';
import authRoutes from '../src/routes/auth.routes.js';
import noteRoutes from '../src/routes/note.routes.js';
import uploadRoutes from '../src/routes/upload.routes.js';


const app = express();

// ── CORS ───────────────────────────────────────────────────────────────────
// Build the allowed-origins list from the FRONTEND_URL env var.
// Multiple origins can be separated by commas, e.g.:
//   FRONTEND_URL=https://ai-smart-notes-frontend.onrender.com,http://localhost:5173
const rawOrigins = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = rawOrigins.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin "${origin}" not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,   // let cors() respond to OPTIONS automatically
    optionsSuccessStatus: 204,  // some browsers choke on 200 for OPTIONS
  })
);
// ──────────────────────────────────────────────────────────────────────────

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
