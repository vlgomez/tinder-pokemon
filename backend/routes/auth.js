const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || "dev_secret",
    { expiresIn: "7d" }
  );
}

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, city } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "username, email y password son obligatorios" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: "Email ya registrado" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      passwordHash,
      city: city || null,
    });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: { id: user.id, username: user.username, email: user.email, city: user.city },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email y password son obligatorios" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    const token = signToken(user);

    return res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, city: user.city },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno" });
  }
});

module.exports = router;
