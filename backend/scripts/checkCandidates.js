const db = require('../models');
const { Op } = require('sequelize');

async function run(userId=1){
  await db.sequelize.authenticate();
  console.log('DB connected');

  const me = userId;
  const mySwipes = await db.Swipe.findAll({ where: { fromUserId: me }, attributes: ['toUserId'] });
  const swipedUserIds = mySwipes.map((s) => s.toUserId);

  const myOwned = await db.UserCard.findAll({ where: { UserId: me }, attributes: ['CardId'] });
  const myOwnedCardIds = [...new Set(myOwned.map((c) => c.CardId))];

  const myWishlist = await db.Wishlist.findAll({ where: { UserId: me }, attributes: ['CardId'] });
  const myWantedCardIds = [...new Set(myWishlist.map((w) => w.CardId))];

  console.log({ myOwnedCardIds, myWantedCardIds, swipedUserIds });

  const candidatesMap = new Map();

  if (myWantedCardIds.length > 0) {
    const rows = await db.UserCard.findAll({
      where: {
        CardId: { [Op.in]: myWantedCardIds },
        UserId: { [Op.ne]: me, [Op.notIn]: swipedUserIds },
        isForTrade: true,
      },
      include: [{ model: db.Card }],
      limit: 200,
    });

    const userIds = [...new Set(rows.map((r) => r.UserId))];
    const users = await db.User.findAll({ where: { id: { [Op.in]: userIds } }, attributes: ['id','username','city','avatarUrl'] });
    const userMap = new Map(users.map((u)=>[u.id,u]));

    for (const r of rows) {
      const u = userMap.get(r.UserId);
      if (!u) continue;
      if (!candidatesMap.has(u.id)) {
        candidatesMap.set(u.id, { user: u, theyHaveINeed: [], theyNeedIHave: [] });
      }
      if (r.Card) candidatesMap.get(u.id).theyHaveINeed.push(r.Card);
    }
  }

  if (myOwnedCardIds.length > 0) {
    const rows = await db.Wishlist.findAll({
      where: {
        CardId: { [Op.in]: myOwnedCardIds },
        UserId: { [Op.ne]: me, [Op.notIn]: swipedUserIds },
      },
      include: [{ model: db.Card }],
      limit: 200,
    });

    const userIds = [...new Set(rows.map((r) => r.UserId))];
    const users = await db.User.findAll({ where: { id: { [Op.in]: userIds } }, attributes: ['id','username','city','avatarUrl'] });
    const userMap = new Map(users.map((u)=>[u.id,u]));

    for (const r of rows) {
      const u = userMap.get(r.UserId);
      if (!u) continue;
      if (!candidatesMap.has(u.id)) {
        candidatesMap.set(u.id, { user: u, theyHaveINeed: [], theyNeedIHave: [] });
      }
      if (r.Card) candidatesMap.get(u.id).theyNeedIHave.push(r.Card);
    }
  }

  const dedupeById = (arr) => { const map = new Map(); for (const c of arr) map.set(c.id, c); return [...map.values()]; };

  const candidates = [...candidatesMap.values()].map((c) => {
    c.theyHaveINeed = dedupeById(c.theyHaveINeed);
    c.theyNeedIHave = dedupeById(c.theyNeedIHave);
    c.score = c.theyHaveINeed.length * 2 + c.theyNeedIHave.length;
    return c;
  });

  candidates.sort((a,b)=>b.score-a.score);
  console.log('candidates:', JSON.stringify(candidates, null, 2));

  await db.sequelize.close();
}

run(process.argv[2] ? Number(process.argv[2]) : 1).catch(err=>{console.error(err); process.exit(1)});
