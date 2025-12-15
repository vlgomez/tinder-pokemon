require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// =======================
// Middlewares básicos
// =======================
app.use(cors());
app.use(express.json());

// =======================
// Importar modelos (Sequelize)
// =======================
const db = require("./models");

// =======================
// Rutas
// =======================
app.get("/", (req, res) => {
  res.json({ status: "OK", app: "Tinder Pokémon API" });
});

app.use("/auth", require("./routes/auth"));
app.use("/users", require("./routes/users"));
app.use("/cards", require("./routes/cards"));
app.use("/wishlist", require("./routes/wishlist"));
app.use("/swipes", require("./routes/swipes"));
app.use("/matches", require("./routes/matches"));

// =======================
// Arranque del servidor
// =======================
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await db.sequelize.authenticate();
    console.log("DB conectada correctamente ✅");

    await db.sequelize.sync({ alter: true });
    console.log("Tablas sincronizadas ✅");

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
  }
}

startServer();
