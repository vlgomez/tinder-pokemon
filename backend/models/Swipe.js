
module.exports = (sequelize, DataTypes) => {
  const Swipe = sequelize.define(
    "Swipe",
    {
      type: { type: DataTypes.ENUM("like", "dislike"), allowNull: false },
    },
    {
      tableName: "swipes",
      indexes: [
        { unique: true, fields: ["fromUserId", "toUserId"] }, // evita duplicados
      ],
    }
  );
  return Swipe;
};
