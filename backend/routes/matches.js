const express = require("express");
const auth = require("../middleware/auth");
const { Match, Message, User, Sequelize } = require("../models");
const Op = Sequelize.Op;

const router = express.Router();

// GET /matches - lista de matches del usuario
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const matches = await Match.findAll({
      where: { [Op.or]: [{ user1Id: userId }, { user2Id: userId }] },
      include: [
        { model: User, as: "user1", attributes: ["id", "username", "city", "avatarUrl"] },
        { model: User, as: "user2", attributes: ["id", "username", "city", "avatarUrl"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    const payload = matches.map((m) => {
      const otherUser = m.user1Id === userId ? m.user2 : m.user1;
      return { id: m.id, otherUser };
    });

    // añadir último mensaje por match (si existe)
    const withLast = await Promise.all(
      payload.map(async (p) => {
        const last = await Message.findOne({ where: { matchId: p.id }, order: [["createdAt", "DESC"]] });
        return { ...p, lastMessage: last ? { id: last.id, text: last.text, createdAt: last.createdAt } : null };
      })
    );

    res.json({ matches: withLast });
  } catch (err) {
    console.error("GET /matches error:", err);
    res.status(500).json({ error: "DB error", detail: err?.message });
  }
});

// GET /matches/:matchId - obtener detalle de match (incluye otherUser)
router.get("/:matchId", auth, async (req, res) => {
  try {
    const matchId = Number(req.params.matchId);
    const userId = req.user.id;

    const match = await Match.findByPk(matchId, {
      include: [
        { model: User, as: "user1", attributes: ["id", "username", "city", "avatarUrl"] },
        { model: User, as: "user2", attributes: ["id", "username", "city", "avatarUrl"] },
      ],
    });

    if (!match) return res.status(404).json({ error: "Match no encontrado" });

    if (match.user1Id !== userId && match.user2Id !== userId) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const otherUser = match.user1Id === userId ? match.user2 : match.user1;
    res.json({ match: { id: match.id, otherUser } });
  } catch (err) {
    console.error("GET /matches/:id error:", err);
    res.status(500).json({ error: "DB error", detail: err?.message });
  }
});

// GET /matches/:matchId/messages - obtener mensajes de un match
router.get("/:matchId/messages", auth, async (req, res) => {
  try {
    const matchId = Number(req.params.matchId);
    const userId = req.user.id;

    const match = await Match.findByPk(matchId);
    if (!match) return res.status(404).json({ error: "Match no encontrado" });

    if (match.user1Id !== userId && match.user2Id !== userId) {
      return res.status(403).json({ error: "No autorizado" });
    }

    const messages = await Message.findAll({
      where: { matchId: matchId },
      order: [["createdAt", "ASC"]],
    });

    res.json({ messages });
  } catch (err) {
    console.error("GET messages error:", err);
    res.status(500).json({
      error: "DB error",
      detail: err?.original?.sqlMessage || err?.message,
    });
  }
});

module.exports = router;
