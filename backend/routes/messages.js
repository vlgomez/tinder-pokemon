const express = require("express");
const auth = require("../middleware/auth");
const { Message, Match } = require("../models");
const { Op } = require("sequelize");

const router = express.Router();

/**
 * Middleware: comprobar que el usuario pertenece al match
 */
async function ensureMatchMember(req, res, next) {
  const matchId = Number(req.params.matchId || req.body.matchId);
  const userId = req.user.id;

  const match = await Match.findOne({
    where: {
      id: matchId,
      [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
    },
  });

  if (!match) {
    return res.status(403).json({ error: "No perteneces a este match" });
  }

  req.match = match;
  next();
}

/**
 * GET /messages/:matchId
 * Devuelve los mensajes de un match
 */
router.get("/:matchId", auth, ensureMatchMember, async (req, res) => {
  try {
    const matchId = Number(req.params.matchId);

    const messages = await Message.findAll({
      where: { matchId },
      order: [["createdAt", "ASC"]],
    });

    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener mensajes" });
  }
});

/**
 * POST /messages/:matchId
 * Body: { text }
 */
router.post("/:matchId", auth, ensureMatchMember, async (req, res) => {
  try {
    const matchId = Number(req.params.matchId);
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Texto vacío" });
    }

    const message = await Message.create({
      matchId,
      senderId: req.user.id,
      text: text.trim(),
    });

    res.status(201).json({ message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al enviar mensaje" });
  }
});

module.exports = router;
