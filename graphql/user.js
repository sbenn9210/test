require("dotenv").config();
const { gql } = require("apollo-server-express");
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");
const crypto = require("crypto");

const { User } = require("../src/db/models");

const refreshTokens = [];

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ALGORITHM = "HS256";
const JWT_EXPIRES_IN = "2m";

const typeDefs = gql`
  type User {
    id: String!
    name: String!
    email: String!
    phone: String!
    password: String!
  }

  type Query {
    current: User
    books: [Book]
    authors: [Author]
  }
  type Mutation {
    register(
      name: String!
      email: String!
      phone: String!
      password: String!
    ): String
    login(email: String!, password: String!): String
    checkNewUser(email: String!): String
    refreshToken: String!
  }

  type Book {
    title: String
    author: Author
  }

  type Author {
    name: String
    books: [Book]
  }
`;

const books = [
  {
    title: "The Awakening",
    author: "Kate Chopin",
  },
  {
    title: "City of Glass",
    author: "Paul Auster",
  },
];

const resolvers = {
  Query: {
    async current(_, args, { loggedInUser }) {
      if (loggedInUser) {
        return await User.findOne({ where: { id: loggedInUser.id } });
      }

      if (!loggedInUser) {
        throw new Error("This is not a logged in user");
      }
    },
    books: () => books,
  },
  Mutation: {
    async register(_, { name, email, phone, password }) {
      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        throw new Error("Email already exists.");
      }
      const user = await User.create({
        name,
        email,
        phone,
        password: await bcrypt.hash(password, 10),
      });

      return jsonwebtoken.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "10d" }
      );
    },
    async login(_, { email, password }, context) {
      const user = await User.findOne({
        where: { email },
      });

      if (!user) {
        throw new Error(incorrectCredentials);
      }

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        throw new Error(incorrectPassword);
      }

      const subject = user.id;
      const refreshToken = crypto.randomBytes(20).toString("hex");

      refreshTokens.push({
        subject,
        token: refreshToken,
      });

      context.res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        signed: true,
      });

      return jsonwebtoken.sign({}, JWT_SECRET, {
        algorithm: JWT_ALGORITHM,
        subject,
        expiresIn: JWT_EXPIRES_IN,
      });
    },
    async checkNewUser(_, { email }) {
      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        throw new Error("Email already exists.");
      }

      return "This is a new user";
    },

    refreshToken: (parent, args, context) => {
      const oldRefreshToken = context.req.signedCookies.refreshToken;
      if (!oldRefreshToken) {
        return new ApolloError("Token refresh failed", "TOKEN_REFRESH_ERROR");
      }

      const oldRefreshTokenIndex = refreshTokens.findIndex(
        (refreshToken) => refreshToken.token === oldRefreshToken
      );

      if (oldRefreshTokenIndex === -1) {
        return new ApolloError("Token refresh failed", "TOKEN_REFRESH_ERROR");
      }

      const subject = refreshTokens[oldRefreshTokenIndex].subject;
      const newRefreshToken = crypto.randomBytes(20).toString("hex");

      refreshTokens.push({
        subject,
        token: newRefreshToken,
      });

      refreshTokens.splice(oldRefreshTokenIndex, 1);

      context.res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        signed: true,
      });

      return jsonwebtoken.sign({}, JWT_SECRET, {
        algorithm: JWT_ALGORITHM,
        subject,
        expiresIn: JWT_EXPIRES_IN,
      });
    },
  },
};

module.exports = {
  typeDefs,
  resolvers,
};
