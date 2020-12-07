require("dotenv").config();
const { gql } = require("apollo-server-express");
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");

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
    ): String
    login(email: String!, password: String!): String
    checkNewUser(email: String!): String
  }
`;

const resolvers = {
  Query: {
    async current(_, args, { loggedInUser }) {
      if (loggedInUser) {
        return await User.findOne({ where: { id: loggedInUser.id } });
      }
      throw new Error("This is not a logged in user");
    },
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
    async login(_, { email, password }) {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        throw new Error(incorrectCredentials);
      }

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        throw new Error(incorrectPassword);
      }

      return jsonwebtoken.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "10d" }
      );
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
