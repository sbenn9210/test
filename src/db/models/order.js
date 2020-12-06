"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Order.init(
    {
      userid: DataTypes.UUID,
      addressid: DataTypes.UUID,
      date: DataTypes.STRING,
      time: DataTypes.STRING,
      instruction: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "order",
      underscored: true,
      timestamps: true,
    }
  );
  return Order;
};
