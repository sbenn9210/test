"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Address extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Address.init(
    {
      userid: DataTypes.UUID,
      street: DataTypes.STRING,
      apt: DataTypes.STRING,
      city: DataTypes.STRING,
      state: DataTypes.STRING,
      zip: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Address",
      tableName: "address",
      timestamps: false,
    }
  );
  return Address;
};
