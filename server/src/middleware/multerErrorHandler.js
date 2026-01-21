export const multerErrorHandler = (err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File too large. Max size is 10MB."
    });
  }
  next(err);
};
