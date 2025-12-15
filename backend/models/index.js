const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

console.log("ENV FILE OK ✅");
console.log("DB_USER =", process.env.DB_USER);
console.log("DB_PASS length =", (process.env.DB_PASS || "").length);
console.log("DB_NAME =", process.env.DB_NAME);


const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    dialect: "mysql",
    logging: false,
  }
);

// Objeto contenedor de modelos (en tu proyecto se exporta esto)
const models = {};

// ===== Cargar modelos =====
models.User = require("./User")(sequelize, DataTypes);
models.Card = require("./Card")(sequelize, DataTypes);
models.UserCard = require("./UserCard")(sequelize, DataTypes);
models.Wishlist = require("./Wishlist")(sequelize, DataTypes);
models.Swipe = require("./Swipe")(sequelize, DataTypes);
models.Match = require("./Match")(sequelize, DataTypes);

// ✅ NUEVO: Message
models.Message = require("./Message")(sequelize, DataTypes);

// ===== Asociaciones =====

// User <-> UserCard
models.User.hasMany(models.UserCard, { foreignKey: "UserId", onDelete: "CASCADE" });
models.UserCard.belongsTo(models.User, { foreignKey: "UserId" });

// Card <-> UserCard
models.Card.hasMany(models.UserCard, { foreignKey: "CardId", onDelete: "CASCADE" });
models.UserCard.belongsTo(models.Card, { foreignKey: "CardId" });

// User <-> Wishlist
models.User.hasMany(models.Wishlist, { foreignKey: "UserId", onDelete: "CASCADE" });
models.Wishlist.belongsTo(models.User, { foreignKey: "UserId" });

// Card <-> Wishlist
models.Card.hasMany(models.Wishlist, { foreignKey: "CardId", onDelete: "CASCADE" });
models.Wishlist.belongsTo(models.Card, { foreignKey: "CardId" });

// Swipes (usuario que swipes a otro)
models.User.hasMany(models.Swipe, { foreignKey: "fromUserId", onDelete: "CASCADE" });
models.Swipe.belongsTo(models.User, { foreignKey: "fromUserId", as: "fromUser" });
// Swipes (usuario que recibe el swipe)
models.User.hasMany(models.Swipe, { foreignKey: "toUserId", onDelete: "CASCADE" });
models.Swipe.belongsTo(models.User, { foreignKey: "toUserId", as: "toUser" });

// Matches (user1Id y user2Id)
models.User.hasMany(models.Match, { foreignKey: "user1Id", onDelete: "CASCADE" });
models.User.hasMany(models.Match, { foreignKey: "user2Id", onDelete: "CASCADE" });
// Asociaciones inversas para poder incluir usuario1/usuario2 en consultas
models.Match.belongsTo(models.User, { foreignKey: "user1Id", as: "user1" });
models.Match.belongsTo(models.User, { foreignKey: "user2Id", as: "user2" });

// ✅ Match <-> Messages
models.Match.hasMany(models.Message, { foreignKey: "matchId", onDelete: "CASCADE" });
models.Message.belongsTo(models.Match, { foreignKey: "matchId" });

// Exponer sequelize
models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;
