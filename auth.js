require("dotenv").config();
const jsonwebtoken = require("jsonwebtoken");

const createTokens = (user) => {
  const refreshToken = jsonwebtoken.sign(
    { userId: user.id, count: user.count },
    process.env.REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );
  const accessToken = jsonwebtoken.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    {
      expiresIn: "15min",
    }
  );

  return { refreshToken, accessToken };
};

module.exports = {
  createTokens,
};
