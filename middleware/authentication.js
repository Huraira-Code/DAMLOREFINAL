import jwt from "jsonwebtoken";

const authenticationMiddleware = (req, res, next) => {
  console.log("abc");
  
  const authHeader = req.headers.authorization;
  console.log(authHeader)
  try {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.json({ msg: "no token provided" });
    }
    const token = authHeader.split(" ")[1];
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    if (verify) {
      return next();
    }
  } catch (error) {
    console.log(error);
    
    res.redirect("/");
  }
};

export default authenticationMiddleware;
