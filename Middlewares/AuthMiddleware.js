require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports.userVerification = (req, res, next) => {
  // const token = req.cookies.token;
  let token = null;
  const { authorization } = req.headers;
  if (authorization) {
    token = authorization.split(" ")[1];
  }
  if (!token) {
    return res.json({
      status: false,
      message: "No token provided or token expired",
    });
  }
  jwt.verify(token, process.env.JWT_KEY, async (err, data) => {
    if (err) {
      return res.json({
        status: false,
        message: "No token provided or token expired",
      });
    } else {
      next();
    }
  });
};
