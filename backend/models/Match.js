module.exports = (sequelize, DataTypes) => {
  const Match = sequelize.define(
    "Match",
    {},
    {
      tableName: "matches",
      indexes: [
        { unique: true, fields: ["user1Id", "user2Id"] }, // evita duplicados
      ],
    }
  );
  return Match;
};
