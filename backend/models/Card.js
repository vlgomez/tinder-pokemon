module.exports = (sequelize, DataTypes) => {
  const Card = sequelize.define(
    "Card",
    {
      name: { type: DataTypes.STRING(120), allowNull: false },
      setName: { type: DataTypes.STRING(120), allowNull: true },
      rarity: { type: DataTypes.STRING(60), allowNull: true },
    },
    { tableName: "cards" }
  );
  return Card;
};
