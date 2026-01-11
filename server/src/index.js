import dotenv from "dotenv";

/**
 * Load env variables FIRST
 * Absolute path avoids issues with spaces in folder names
 */
dotenv.config({
  path: new URL("../.env", import.meta.url)
});

import app from "./app.js";
import connectDB from "./config/db.js";

connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
