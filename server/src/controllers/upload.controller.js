import cloudinary from "../config/cloudinary.js";

export const uploadFile = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "notes-attachments",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary error:", error);
          return res.status(500).json({ message: error.message });
        }

        res.json({
          url: result.secure_url,
          type: result.resource_type,
          name: file.originalname,
        });
      }
    );

    stream.end(file.buffer);
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};