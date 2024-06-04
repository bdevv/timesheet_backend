require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports.createSecretToken = (id, type) => {
  return jwt.sign({ id, type }, process.env.JWT_KEY, {
    expiresIn: 8 * 60 * 60,
  });
};
module.exports.createRefreshToken = (id, type) => {
  return jwt.sign({ id, type }, process.env.JWT_KEY, {
    expiresIn: 44 * 24 * 60 * 60,
  });
};
