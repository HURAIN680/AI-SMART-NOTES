import jwt from "jsonwebtoken";

/**
 * Protect middleware — verifies JWT and attaches user identity to req.user.
 * Does NOT query MongoDB on every request (performance optimization).
 * The JWT payload already contains the user ID signed at login time.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach both .id (string) and ._id (string) so all controllers work
    // without a DB round-trip on every request.
    req.user = { id: decoded.id, _id: decoded.id };

    return next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export default protect;