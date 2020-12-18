const { ApolloServer, makeExecutableSchema } = require("apollo-server-express");
const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const { verify } = require("jsonwebtoken");

const { typeDefs: users, resolvers: userResolvers } = require("./graphql/user");
const { User } = require("./src/db/models");
const { createTokens } = require("./auth");

const PORT = 4000;
const app = express();

var corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};

app.use(cors(corsOptions));

const schema = makeExecutableSchema({
  typeDefs: [users],
  resolvers: [userResolvers],
});

const server = new ApolloServer({
  schema,
  playground: {
    endpoint: "/graphql",
  },
  context: ({ req, res }) => ({ req, res }),
});

app.use(cookieParser(process.env.COOKIE_SECRET));

app.use(async (req, res, next) => {
  const accessToken = req.cookies["access-token"];
  const refreshToken = req.cookies["refresh-token"];
  if (!refreshToken && !accessToken) {
    return next();
  }

  try {
    const data = verify(accessToken, process.env.JWT_SECRET);
    req.userId = data.userId;
    return next();
  } catch {}

  if (!refreshToken) {
    return next();
  }

  let data;

  try {
    data = verify(refreshToken, process.env.REFRESH_SECRET);
  } catch {
    return next();
  }

  const user = await User.findOne({ where: { id: data.userId } });
  // token has been invalidated

  if (!user || user.count !== data.count) {
    return next();
  }

  const tokens = createTokens(user);

  res.cookie("refresh-token", tokens.refreshToken);
  res.cookie("access-token", tokens.accessToken);
  req.userId = user.id;

  next();
});

server.applyMiddleware({ app, cors: false });

app.listen(PORT, () => {
  console.log(`🚀 The server is listening on ${PORT}`);
});
