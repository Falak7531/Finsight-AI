export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: token missing",
    });
  }

  req.user = {
    id: "demo-user",
    email: "demo@insight.ai",
  };

  return next();
};
