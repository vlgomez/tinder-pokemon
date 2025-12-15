module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define("Message", {
    text: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    fromUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    toUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  return Message;
};
