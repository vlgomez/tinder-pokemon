const db = require("../models");

async function seed(){
  try{
    await db.sequelize.authenticate();
    console.log('DB connected');

    // Delete everything (careful!)
    await db.Message.destroy({ where: {} });
    await db.Match.destroy({ where: {} });
    await db.Swipe.destroy({ where: {} });
    await db.Wishlist.destroy({ where: {} });
    await db.UserCard.destroy({ where: {} });
    await db.Card.destroy({ where: {} });
    await db.User.destroy({ where: {} });

    // Create users (password: 123456)
    const bcrypt = require('bcryptjs');
    const pw = await bcrypt.hash('123456', 10);
    const pablo = await db.User.create({ username: 'pablo', email: 'pablo@test.com', passwordHash: pw, city: 'Madrid', avatarUrl: 'https://i.pravatar.cc/150?u=pablo' });
    const ana = await db.User.create({ username: 'ana', email: 'ana@test.com', passwordHash: pw, city: 'Barcelona', avatarUrl: 'https://i.pravatar.cc/150?u=ana' });
    const peerro = await db.User.create({ username: 'peerro', email: 'peerro@test.com', passwordHash: pw, city: 'Valencia', avatarUrl: 'https://i.pravatar.cc/150?u=peerro' });

    // Create cards
    const umbreon = await db.Card.create({ name: 'Umbreon VMAX', setName: 'Evolving Skies', rarity: 'Ultra Rare' });
    const pikachu = await db.Card.create({ name: 'Pikachu', setName: 'Base Set', rarity: 'Common' });
    const char = await db.Card.create({ name: 'Charizard', setName: 'Base Set', rarity: 'Rare' });

    // UserCards
    await db.UserCard.create({ UserId: pablo.id, CardId: umbreon.id, isForTrade: true });
    await db.UserCard.create({ UserId: ana.id, CardId: char.id, isForTrade: true });
    await db.UserCard.create({ UserId: peerro.id, CardId: pikachu.id, isForTrade: true });

    // Wishlist
    await db.Wishlist.create({ UserId: pablo.id, CardId: char.id, priority: 8 });
    await db.Wishlist.create({ UserId: ana.id, CardId: umbreon.id, priority: 9 });

    // Swipes (pablo likes ana -> ana likes pablo -> match)
    await db.Swipe.create({ fromUserId: pablo.id, toUserId: ana.id, type: 'like' });
    await db.Swipe.create({ fromUserId: ana.id, toUserId: pablo.id, type: 'like' });

    // Create match
    const user1Id = Math.min(pablo.id, ana.id);
    const user2Id = Math.max(pablo.id, ana.id);
    const match = await db.Match.create({ user1Id, user2Id });

    // Messages
    await db.Message.create({ matchId: match.id, fromUserId: pablo.id, toUserId: ana.id, text: 'Hola Ana!' });
    await db.Message.create({ matchId: match.id, fromUserId: ana.id, toUserId: pablo.id, text: 'Hola Pablo! Encantada' });

    console.log('Seed done');
    process.exit(0);
  }catch(err){
    console.error('Seed error', err);
    process.exit(1);
  }
}

seed();
