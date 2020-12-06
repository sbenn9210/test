const { v4: uuid } = require("uuid");

const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      phone: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "User",
      tableName: "user",
      underscored: true,
      timestamps: true,
      //todo: {Add soft delete}
    }
  );
  User.beforeCreate((user, _) => {
    return (user.id = uuid());
  });
  return User;
};
