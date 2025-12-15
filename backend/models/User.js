module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      username: { type: DataTypes.STRING(40), allowNull: false },
      email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false },
      city: { type: DataTypes.STRING(80), allowNull: true },
      avatarUrl: { type: DataTypes.STRING(255), allowNull: true },
    },
    { tableName: "users" }
  );
  return User;
};
