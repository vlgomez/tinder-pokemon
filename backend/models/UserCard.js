module.exports = (sequelize, DataTypes) => {
  const UserCard = sequelize.define(
    "UserCard",
    {
      photoUrl: { type: DataTypes.STRING(500), allowNull: true },
      language: { type: DataTypes.STRING(30), allowNull: true },
      condition: { type: DataTypes.STRING(30), allowNull: true },
      isForTrade: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: "user_cards" }
  );
  return UserCard;
};
