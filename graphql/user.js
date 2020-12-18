require("dotenv").config();
const { gql } = require("apollo-server-express");
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");
const Sequelize = require("sequelize");

const { User } = require("../src/db/models");

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
  }
  type Mutation {
    register(
      name: String!
      email: String!
      phone: String!
      password: String!
    ): User
    login(email: String!, password: String!): User
    checkNewUser(email: String!): String
    invalidateTokens: Boolean!
  }
`;

const resolvers = {
  Query: {
    async current(_, args, { req }) {
      if (!req.userId) {
        return null;
      }
      return await User.findOne({ where: { id: req.userId } });
    },
  },
  Mutation: {
    async register(_, { name, email, phone, password }, { res }) {
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

      const accessToken = jsonwebtoken.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "15min" }
      );
      const refreshToken = jsonwebtoken.sign(
        { userId: user.id, email: user.email, count: user.count },
        process.env.REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("refresh-token", refreshToken, {
        httpOnly: true,
        signed: true,
      });
      res.cookie("access-token", accessToken, {
        httpOnly: true,
        signed: true,
      });

      return user;
    },
    async login(_, { email, password }, { res }) {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        throw new Error(incorrectCredentials);
      }

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        throw new Error(incorrectPassword);
      }

      const accessToken = jsonwebtoken.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "15min" }
      );
      const refreshToken = jsonwebtoken.sign(
        { userId: user.id, email: user.email, count: user.count },
        process.env.REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("refresh-token", refreshToken, {
        httpOnly: true,
        signed: true,
      });
      res.cookie("access-token", accessToken, {
        httpOnly: true,
        signed: true,
      });

      return user;
    },

    invalidateTokens: async (_, __, { req }) => {
      console.log(req.userId);
      if (!req.userId) {
        return false;
      }

      try {
        await User.update(
          { count: Sequelize.literal("count + 1") },
          { where: { id: req.userId } }
        );
      } catch (error) {
        throw new Error(error);
      }

      return true;
    },
    async checkNewUser(_, { email }) {
      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        throw new Error("Email already exists.");
      }

      return "This is a new user";
    },
  },
};

module.exports = {
  typeDefs,
  resolvers,
};
