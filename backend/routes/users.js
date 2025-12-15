const express = require("express");
const auth = require("../middleware/auth");
const { User } = require("../models");

const router = express.Router();

// GET /users/me (protegida)
router.get("/me", auth, async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ["id", "username", "email", "city", "createdAt"],
  });

  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  res.json({ user });
});

module.exports = router;
