const express = require("express");
const auth = require("../middleware/auth");
const { Op } = require("sequelize");

const {
  Swipe,
  Match,
  User,
  UserCard,
  Wishlist,
  Card,
} = require("../models");

const router = express.Router();

/**
 * GET /swipes/candidates
 * Devuelve usuarios candidatos para hacer swipe
 */
router.get("/candidates", auth, async (req, res) => {
  try {
    const me = req.user.id;
    const limit = Math.min(Number(req.query.limit) || 10, 30);
    const offset = Math.max(0, Number(req.query.offset) || 0);
    // include_swiped=true -> include users you've already swiped; default true to preserve current behavior
    const includeSwiped = req.query.include_swiped === undefined ? true : String(req.query.include_swiped) === 'true';

    // 1️⃣ Usuarios a los que ya he swipeado
    const mySwipes = await Swipe.findAll({
      where: { fromUserId: me },
      attributes: ["toUserId"],
    });
    const swipedUserIds = mySwipes.map((s) => s.toUserId);

    // 2️⃣ Cartas que tengo
    const myOwned = await UserCard.findAll({
      where: { UserId: me },
      attributes: ["CardId"],
    });
    const myOwnedCardIds = [...new Set(myOwned.map((c) => c.CardId))];

    // 3️⃣ Cartas que busco
    const myWishlist = await Wishlist.findAll({
      where: { UserId: me },
      attributes: ["CardId"],
    });
    const myWantedCardIds = [...new Set(myWishlist.map((w) => w.CardId))];

    // Mostrar a todos los usuarios aunque no tengan cartas o wishlist.
    // (Antes devolvíamos [] si no tenías cartas ni wishlist; ahora incluimos a todos)
    // No hacemos return aquí; seguimos construyendo candidatos a partir de todos los usuarios.

    const candidatesMap = new Map();

    const asPlainCard = (r, extra = {}) => {
      if (!r.Card) return null;
      const base = r.Card.toJSON ? r.Card.toJSON() : { ...r.Card };
      return { ...base, ...extra };
    };

    // ============================================================
    // A) Ellos TIENEN algo que YO BUSCO
    // ============================================================
    if (myWantedCardIds.length > 0) {
      const rows = await UserCard.findAll({
        where: {
          CardId: { [Op.in]: myWantedCardIds },
          UserId: includeSwiped ? { [Op.ne]: me } : { [Op.ne]: me, [Op.notIn]: swipedUserIds },
          isForTrade: true,
        },
        include: [{ model: Card }],
        limit: 200,
      });

      const userIds = [...new Set(rows.map((r) => r.UserId))];

      const users = await User.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: ["id", "username", "city"],
      });

      const userMap = new Map(users.map((u) => [u.id, u]));

      for (const r of rows) {
        const u = userMap.get(r.UserId);
        if (!u) continue;

        if (!candidatesMap.has(u.id)) {
          candidatesMap.set(u.id, {
            user: u,
            theyHaveINeed: [],
            theyNeedIHave: [],
          });
        }

        const card = asPlainCard(r, { photoUrl: r.photoUrl, userCardId: r.id });
        if (card) {
          candidatesMap.get(u.id).theyHaveINeed.push(card);
        }
      }
    }

    // ============================================================
    // B) Ellos BUSCAN algo que YO TENGO
    // ============================================================
    if (myOwnedCardIds.length > 0) {
      const rows = await Wishlist.findAll({
        where: {
          CardId: { [Op.in]: myOwnedCardIds },
          UserId: includeSwiped ? { [Op.ne]: me } : { [Op.ne]: me, [Op.notIn]: swipedUserIds },
        },
        include: [{ model: Card }],
        limit: 200,
      });

      const userIds = [...new Set(rows.map((r) => r.UserId))];

      const users = await User.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: ["id", "username", "city"],
      });

      const userMap = new Map(users.map((u) => [u.id, u]));

      for (const r of rows) {
        const u = userMap.get(r.UserId);
        if (!u) continue;

        if (!candidatesMap.has(u.id)) {
          candidatesMap.set(u.id, {
            user: u,
            theyHaveINeed: [],
            theyNeedIHave: [],
          });
        }

        const card = asPlainCard(r);
        if (card) {
          candidatesMap.get(u.id).theyNeedIHave.push(card);
        }
      }
    }

    // ============================================================
    // 3.5) Asegurarnos de incluir a todos los usuarios (incluso si no tienen cards/wishlist)
    // ============================================================
    // Optionally exclude users that I've already swiped depending on includeSwiped flag
    const allUsersWhere = includeSwiped ? { id: { [Op.ne]: me } } : { id: { [Op.ne]: me, [Op.notIn]: swipedUserIds } };
    const allUsers = await User.findAll({
      where: allUsersWhere,
      attributes: ["id", "username", "city"],
    });

    for (const u of allUsers) {
      if (!candidatesMap.has(u.id)) {
        candidatesMap.set(u.id, {
          user: u,
          theyHaveINeed: [],
          theyNeedIHave: [],
        });
      }
    }

    // ============================================================
    // 4️⃣ Limpiar duplicados + score
    // ============================================================
    const dedupeById = (arr) => {
      const map = new Map();
      for (const c of arr) {
        const existing = map.get(c.id);
        const shouldReplace = !existing || (!!c.photoUrl && !existing.photoUrl);
        if (shouldReplace) map.set(c.id, c);
      }
      return [...map.values()];
    };

    const candidates = [...candidatesMap.values()].map((c) => {
      c.theyHaveINeed = dedupeById(c.theyHaveINeed);
      c.theyNeedIHave = dedupeById(c.theyNeedIHave);
      c.score = c.theyHaveINeed.length * 2 + c.theyNeedIHave.length;
      return c;
    });

    candidates.sort((a, b) => b.score - a.score);

    // Support offset pagination, and include total for the UI
    const total = candidates.length;
    const paged = candidates.slice(offset, offset + limit);

    res.json({ candidates: paged, total, offset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al generar candidatos" });
  }
});

/**
 * POST /swipes/like
 */
router.post("/like", auth, async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const { toUserId } = req.body;

    if (!toUserId || Number(toUserId) === Number(fromUserId)) {
      return res.status(400).json({ error: "toUserId inválido" });
    }

    const existing = await Swipe.findOne({
      where: { fromUserId, toUserId },
    });
    if (existing) {
      return res.status(409).json({ error: "Ya hiciste swipe a este usuario" });
    }

    await Swipe.create({ fromUserId, toUserId, type: "like" });

    const reverseLike = await Swipe.findOne({
      where: {
        fromUserId: toUserId,
        toUserId: fromUserId,
        type: "like",
      },
    });

    let match = null;

    if (reverseLike) {
      const user1Id = Math.min(fromUserId, toUserId);
      const user2Id = Math.max(fromUserId, toUserId);

      match = await Match.findOne({ where: { user1Id, user2Id } });

      if (!match) {
        match = await Match.create({ user1Id, user2Id });
      }
    }

    res.status(201).json({
      liked: true,
      match: match
        ? { id: match.id, user1Id: match.user1Id, user2Id: match.user2Id }
        : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en swipe like" });
  }
});

/**
 * POST /swipes/dislike
 */
router.post("/dislike", auth, async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const { toUserId } = req.body;

    if (!toUserId || Number(toUserId) === Number(fromUserId)) {
      return res.status(400).json({ error: "toUserId inválido" });
    }

    const existing = await Swipe.findOne({
      where: { fromUserId, toUserId },
    });
    if (existing) {
      return res.status(409).json({ error: "Ya hiciste swipe a este usuario" });
    }

    await Swipe.create({ fromUserId, toUserId, type: "dislike" });

    res.status(201).json({ disliked: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en swipe dislike" });
  }
});

module.exports = router;
