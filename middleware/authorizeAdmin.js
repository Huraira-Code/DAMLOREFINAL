import jwt from "jsonwebtoken";

export const authorizeAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.split(" ")[1];
  const verify = jwt.verify(token, process.env.JWT_SECRET);

  if (verify.role === "admin") {
    return next();
  } else {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
};
