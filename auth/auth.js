import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "Authorization required" });

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
