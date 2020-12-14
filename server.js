const { ApolloServer, makeExecutableSchema } = require("apollo-server-express");
const express = require("express");
const jsonwebtoken = require("express-jwt");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { typeDefs: users, resolvers: userResolvers } = require("./graphql/user");

const PORT = 4000;
const app = express();
const COOKIE_SECRET = process.env.COOKIE_SECRET;

app.use(cookieParser(COOKIE_SECRET));

const authentication = jsonwebtoken({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
  credentialsRequired: false,
});

app.use(authentication);

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
  context: (req) => ({ ...req }),
});

server.applyMiddleware({ app, cors: false });

app.listen(PORT, () => {
  console.log(`🚀 The server is listening on ${PORT}`);
});
