const express = require("express");
const auth = require("../middleware/auth");
const { Wishlist, Card } = require("../models");

const router = express.Router();

/**
 * GET /wishlist
 * Lista de cartas que busca el usuario autenticado
 */
router.get("/", auth, async (req, res) => {
  try {
    const items = await Wishlist.findAll({
      where: { UserId: req.user.id },
      include: [{ model: Card }],
      order: [["createdAt", "DESC"]],
    });

    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener wishlist" });
  }
});

/**
 * POST /wishlist/add
 * Añade una carta a la wishlist.
 * Permite:
 * - pasar cardId (si ya existe)
 * - o crear Card con (name, setName, rarity)
 * Body: { cardId?, name?, setName?, rarity?, priority? }
 */
router.post("/add", auth, async (req, res) => {
  try {
    const { cardId, name, setName, rarity, priority } = req.body;

    let card = null;

    if (cardId) {
      card = await Card.findByPk(cardId);
      if (!card) return res.status(404).json({ error: "cardId no existe" });
    } else {
      if (!name) return res.status(400).json({ error: "Falta name (o cardId)" });

      card = await Card.findOne({
        where: { name, setName: setName || null },
      });

      if (!card) {
        card = await Card.create({
          name,
          setName: setName || null,
          rarity: rarity || null,
        });
      }
    }

    // Evitar duplicados: misma carta en wishlist del mismo usuario
    const exists = await Wishlist.findOne({
      where: { UserId: req.user.id, CardId: card.id },
    });
    if (exists) return res.status(409).json({ error: "Ya tienes esa carta en tu wishlist" });

    const item = await Wishlist.create({
      UserId: req.user.id,
      CardId: card.id,
      priority: Number.isInteger(priority) ? priority : 3,
    });

    const created = await Wishlist.findByPk(item.id, { include: [{ model: Card }] });

    res.status(201).json({ item: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al añadir a wishlist" });
  }
});

/**
 * DELETE /wishlist/:id
 * Borra un item de wishlist del usuario autenticado
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const item = await Wishlist.findOne({
      where: { id, UserId: req.user.id },
    });

    if (!item) return res.status(404).json({ error: "Item no encontrado" });

    await item.destroy();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al borrar item de wishlist" });
  }
});

module.exports = router;
