import e from "express";
import multer from "multer";
import path from "path";

// 1. Keep 'diskStorage' so files are saved to your 'uploads' folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Ensure this folder exists in your project root
  },
  filename: function (req, file, cb) {
    // Unique filename: fieldname-timestamp.extension
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});

// 2. Configure Multer with your new Limits and Filters
export const upload = multer({
  storage: storage,
  
  // Increase limit to 20MB (Fixes "File too large" error)
  limits: { fileSize: 20 * 1024 * 1024 }, 

  // Strict File Filtering
  fileFilter(req, file, cb) {
    const allowed = [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (!allowed.includes(file.mimetype)) {
      // Reject file
      cb(new Error("File type not supported. Only Images, PDFs, and Docs allowed."));
    } else {
      // Accept file
      cb(null, true);
    }
  }
});

export default upload;