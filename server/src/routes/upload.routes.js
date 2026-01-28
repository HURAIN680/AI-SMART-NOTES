import express from "express";
import upload from "../middleware/upload.middleware.js";
import protect from "../middleware/auth.middleware.js";
import { uploadFile } from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/", protect, upload.single("file"), uploadFile);

export default router;