process.env.DB_DIALECT = 'sqlite';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const jwt = require('jsonwebtoken');

const { app } = require('../server');
const db = require('../models');

beforeAll(async () => {
  await db.sequelize.sync({ force: true });
});

afterAll(async () => {
  await db.sequelize.close();
});

async function createUser(username, email) {
  const u = await db.User.create({ username, email, passwordHash: 'pw', city: 'TestCity' });
  return u;
}

function tokenFor(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'dev_secret');
}

test('GET /swipes/candidates returns other users even if me has no cards/wishlist', async () => {
  const me = await createUser('me', 'me@test.com');
  const other1 = await createUser('u1', 'u1@test.com');
  const other2 = await createUser('u2', 'u2@test.com');

  const token = tokenFor(me);

  const res = await request(app).get('/swipes/candidates').set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.candidates)).toBe(true);
  const ids = res.body.candidates.map((c) => c.user.id).sort();
  expect(ids).toEqual([other1.id, other2.id].sort());
});

test('limit query param respected', async () => {
  const me = await db.User.findOne({ where: { username: 'me' } });
  const token = tokenFor(me);

  const res = await request(app).get('/swipes/candidates?limit=1').set('Authorization', `Bearer ${token}`);
  expect(res.status).toBe(200);
  expect(res.body.candidates.length).toBe(1);
});

test('pagination with offset works', async () => {
  // create many users
  const base = await createUser('base', 'base@test.com');
  const others = [];
  for (let i = 0; i < 12; i++) {
    others.push(await createUser('u_pag_' + i, `u_pag_${i}@test.com`));
  }

  const me = await db.User.findOne({ where: { username: 'me' } });
  const token = tokenFor(me);

  const p1 = await request(app).get('/swipes/candidates?limit=5&offset=0').set('Authorization', `Bearer ${token}`);
  expect(p1.status).toBe(200);
  expect(p1.body.candidates.length).toBe(5);
  expect(p1.body.total).toBeGreaterThanOrEqual(12);

  const p2 = await request(app).get('/swipes/candidates?limit=5&offset=5').set('Authorization', `Bearer ${token}`);
  expect(p2.status).toBe(200);
  expect(p2.body.candidates.length).toBe(5);

  const p3 = await request(app).get('/swipes/candidates?limit=5&offset=10').set('Authorization', `Bearer ${token}`);
  expect(p3.status).toBe(200);
  // remaining (>=2)
  expect(p3.body.candidates.length).toBeGreaterThanOrEqual(2);
});

test('swiping like and creating match works', async () => {
  // create two users and make a mutual like
  const a = await createUser('alice', 'alice@test.com');
  const b = await createUser('bob', 'bob@test.com');

  // bob likes alice first
  await request(app)
    .post('/swipes/like')
    .set('Authorization', `Bearer ${tokenFor(b)}`)
    .send({ toUserId: a.id })
    .expect(201);

  // alice likes bob -> should create match
  const res = await request(app)
    .post('/swipes/like')
    .set('Authorization', `Bearer ${tokenFor(a)}`)
    .send({ toUserId: b.id })
    .expect(201);

  expect(res.body.liked).toBe(true);
  expect(res.body.match).toBeTruthy();
});

test('include_swiped=false excludes already swiped users', async () => {
  const me = await createUser('swiper', 'swp@test.com');
  const u1 = await createUser('u_ex', 'uex@test.com');
  const u2 = await createUser('u_ok', 'uok@test.com');

  // me swipes on u_ex
  await request(app)
    .post('/swipes/like')
    .set('Authorization', `Bearer ${tokenFor(me)}`)
    .send({ toUserId: u1.id })
    .expect(201);

  // With include_swiped=false, u_ex should be excluded
  const res1 = await request(app)
    .get('/swipes/candidates?include_swiped=false&limit=200')
    .set('Authorization', `Bearer ${tokenFor(me)}`)
    .expect(200);

  const ids1 = res1.body.candidates.map((c) => c.user.id);
  expect(ids1).not.toContain(u1.id);

  // With include_swiped=true, u_ex should be present (ask for large limit to be sure)
  const res2 = await request(app)
    .get('/swipes/candidates?include_swiped=true&limit=200')
    .set('Authorization', `Bearer ${tokenFor(me)}`)
    .expect(200);

  const ids2 = res2.body.candidates.map((c) => c.user.id);
  expect(ids2).toContain(u1.id);
});