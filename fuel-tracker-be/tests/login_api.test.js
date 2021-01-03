const initEntries = require('./data/initEntries');
const db = require('../src/database/database');
const supertest = require('supertest');
const app = require('../src/app');
const helper = require('./test_helper');
const User = require('../src/database/models/user');
const api = supertest(app);

describe('Login succeeds when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await helper.addInitialUsersInDb();
  });

  test('valid credentials are given', async () => {
    const allTestUsers = initEntries.testUsers;
    const testUser = allTestUsers[0];

    const response = await api
      .post('/api/login')
      .send({
        user: {
          username: testUser.username,
          password: testUser.password
        }
      })
      .expect(200)
      .expect('Content-Type', /application\/json/);

    // Confirm that the repsonse contains generated token.
    expect(response.body.token).toBeTruthy();

    // Confirm that the token includes correct user.
    const decodedToken = helper.decodeUserToken(response.body.token);
    expect(decodedToken.name).toBe(testUser.name);
  });
});

describe('Password verification succeeds when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await helper.addInitialUsersInDb();
  });

  test('valid token, user id and password are given', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    await api
      .post('/api/login/verify')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send({
        user: {
          password: 'tepsukka123?'
        }
      })
      .expect(204);
  });
});

describe('Login fails when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await helper.addInitialUsersInDb();
  });

  test('invalid password is given', async () => {
    const allTestUsers = initEntries.testUsers;
    const testUser = allTestUsers[1];

    const response = await api
      .post('/api/login')
      .send({
        user: {
          username: testUser.username,
          password: 'this is invalid password'
        }
      })
      .expect(401)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toBe('invalid username or password');
    expect(response.body.token).not.toBeTruthy();
    expect(response.body.name).not.toBeTruthy();
  });

  test('non-existing user is given', async () => {
    const response = await api
      .post('/api/login')
      .send({
        user: {
          username: 'this user does not exist',
          password: 'this is invalid password'
        }
      })
      .expect(401)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toBe('invalid username or password');
    expect(response.body.token).not.toBeTruthy();
    expect(response.body.name).not.toBeTruthy();
  });

  test('empty user object is given', async () => {
    const response = await api
      .post('/api/login')
      .send({
        user: {}
      })
      .expect(401)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toBe('invalid username or password');
    expect(response.body.token).not.toBeTruthy();
    expect(response.body.name).not.toBeTruthy();
  });

  test('request does not contain any payload', async () => {
    const response = await api
      .post('/api/login')
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toBe('missing mandatory arguments');
    expect(response.body.token).not.toBeTruthy();
    expect(response.body.name).not.toBeTruthy();
  });
});

describe('Password verification fails when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await helper.addInitialUsersInDb();
  });

  test('invalid password is given', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    const response = await api
      .post('/api/login/verify')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send({
        user: {
          id: decodedToken.id,
          password: 'invalid-password'
        }
      })
      .expect(401);

    expect(response.body.error).toBe('invalid username or password');
  });

  test('authorization header missing', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    const response = await api
      .post('/api/login/verify')
      .send({
        user: {
          id: decodedToken.id,
          password: 'tepsukka123?'
        }
      })
      .expect(401);

    expect(response.body.error).toBe('authorization header missing');
  });

  test('`bearer` is missing from authorization header', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    const response = await api
      .post('/api/login/verify')
      .set('Authorization', `${loggedInUser.token}`)
      .send({
        user: {
          id: decodedToken.id,
          password: 'tepsukka123?'
        }
      })
      .expect(401);

    expect(response.body.error).toBe('bearer is missing');
  });

  test('token is missing', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    const response = await api
      .post('/api/login/verify')
      .set('Authorization', 'bearer' )
      .send({
        user: {
          id: decodedToken.id,
          password: 'tepsukka123?'
        }
      })
      .expect(401);

    expect(response.body.error).toBe('bearer is missing');
  });

  test('token is invalid', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);
    const invalidToken = loggedInUser.token.slice(0, -1);

    const response = await api
      .post('/api/login/verify')
      .set('Authorization', `bearer ${invalidToken}`)
      .send({
        user: {
          id: decodedToken.id,
          password: 'tepsukka123?'
        }
      })
      .expect(401);

    expect(response.body.error).toBe('invalid token');
  });

  test('user object is missing', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const response = await api
      .post('/api/login/verify')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send({})
      .expect(400);

    expect(response.body.error).toBe('missing mandatory arguments');
  });

});

afterAll(() => {
  db.closeDbConnection();
});