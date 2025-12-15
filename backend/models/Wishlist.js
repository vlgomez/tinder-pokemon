module.exports = (sequelize, DataTypes) => {
  const Wishlist = sequelize.define(
    "Wishlist",
    {
      priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
    },
    { tableName: "wishlists" }
  );
  return Wishlist;
};
