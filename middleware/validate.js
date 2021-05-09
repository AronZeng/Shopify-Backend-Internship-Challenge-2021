const jwt = require("jsonwebtoken");

exports.validateToken = async function (req, res, next) {
  const token = req.headers["authorization"];
  if (!token) {
    res.status(401).json({ message: "No token found, please login first" });
  }
  try {
    const decodedToken = jwt.verify(token, "shopifyisthebest");
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid Token" });
  }
};
