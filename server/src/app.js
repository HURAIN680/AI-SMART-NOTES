import express from 'express';
import cors from 'cors';
import authRoutes from '../src/routes/auth.routes.js';
import noteRoutes from '../src/routes/note.routes.js';


const app = express();

app.use(cors());
app.use(express.json());

// Define your routes here
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);


app.get('/', (req, res) => {
        res.send('backend is running');
});

export default app;
