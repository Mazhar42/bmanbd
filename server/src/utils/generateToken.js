const jwt = require("jsonwebtoken");

const generateToken = (id, expiresIn) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: expiresIn || process.env.JWT_EXPIRE || "30d",
  });
};

module.exports = generateToken;
