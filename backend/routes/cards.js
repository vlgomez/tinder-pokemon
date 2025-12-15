const express = require("express");
const auth = require("../middleware/auth");
const { UserCard, Card } = require("../models");

const router = express.Router();

/**
 * GET /cards/my
 */
router.get("/my", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const cards = await UserCard.findAll({
      where: { UserId: userId },
      include: [{ model: Card }],
      order: [["createdAt", "DESC"]],
    });

    res.json({ cards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al cargar mis cartas" });
  }
});

/**
 * POST /cards/add
 * body: { name, setName, rarity, isForTrade }
 */
router.post("/add", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, setName, rarity, isForTrade } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: "Nombre requerido" });

    // Buscar o crear Card (misma combinación)
    const [card] = await Card.findOrCreate({
      where: {
        name: name.trim(),
        setName: setName?.trim() || null,
        rarity: rarity?.trim() || null,
      },
    });

    const userCard = await UserCard.create({
      UserId: userId,
      CardId: card.id,
      isForTrade: Boolean(isForTrade),
      photoUrl: null,
      language: null,
      condition: null,
    });

    res.status(201).json({ userCard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al añadir carta" });
  }
});

/**
 * PATCH /cards/my/:id
 * id = UserCard.id
 * body: { isForTrade }
 */
router.patch("/my/:id", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);
    const { isForTrade } = req.body;

    const row = await UserCard.findOne({ where: { id, UserId: userId } });
    if (!row) return res.status(404).json({ error: "Carta no encontrada" });

    await row.update({
      isForTrade: typeof isForTrade === "boolean" ? isForTrade : row.isForTrade,
    });

    res.json({ ok: true, card: row });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando la carta" });
  }
});

/**
 * DELETE /cards/my/:id
 * id = UserCard.id
 */
router.delete("/my/:id", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);

    const row = await UserCard.findOne({ where: { id, UserId: userId } });
    if (!row) return res.status(404).json({ error: "Carta no encontrada" });

    await row.destroy();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error borrando la carta" });
  }
});
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) =>
    cb(null, `card_${req.params.id}_${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

// POST /cards/my/:id/photo  (id = UserCard.id)
router.post("/my/:id/photo", auth, upload.single("photo"), async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);

    const row = await UserCard.findOne({ where: { id, UserId: userId } });
    if (!row) return res.status(404).json({ error: "Carta no encontrada" });
    if (!req.file) return res.status(400).json({ error: "Archivo requerido" });

    const photoUrl = `/uploads/${req.file.filename}`;
    await row.update({ photoUrl });

    res.json({ ok: true, photoUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error subiendo foto" });
  }
});


module.exports = router;
