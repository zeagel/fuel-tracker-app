const initEntries = require('./data/initEntries');
const db = require('../src/database/database');
const supertest = require('supertest');
const app = require('../src/app');
const helper = require('./test_helper');
const User = require('../src/database/models/user');
const api = supertest(app);

describe('GET all user request', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await helper.addInitialUsersInDb();
  });

  test('returns all test users in JSON format', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    await api
      .get('/api/users')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('returns amount of test users that exists in the db', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const response = await api
      .get('/api/users')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(response.body).toHaveLength(initEntries.testUsers.length);
  });

  test('returns all test user entries that have created in the db', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const response = await api
      .get('/api/users')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200);

    const names = response.body.map(r => r.name);

    expect(names).toContain('Teppo Testaaja');
    expect(names).toContain('Simo Säätäjä');
    expect(names).toContain('Siiri Siivoaja');
    expect(names).toContain('Seppo Siivoaja');
    expect(names).toContain('Suvi Siivoaja');
  });
});

describe('GET one user request', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await helper.addInitialUsersInDb();
  });

  test('returns one particular test user entry in JSON format', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const usersAtBegin = await helper.usersInDb();
    const userToBeFound = usersAtBegin[0];

    await api
      .get(`/api/users/${userToBeFound.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('returns one particular test user entry when it is requested by id', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const usersAtBegin = await helper.usersInDb();
    const userToBeFound = usersAtBegin[0];

    const response = await api
      .get(`/api/users/${userToBeFound.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(response.body.name).toBe(userToBeFound.name);
  });
});

describe('GET simple user list request', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await helper.addInitialUsersInDb();
  });

  test('returns a simple user list with limited minimal details', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const users = await helper.usersInDb();
    const simpleUsersAtBegin = users.map(u => {
      return { id: u.id, name: u.name, username: u.username };
    });

    const response = await api
      .get('/api/users/simple')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(response.body).toEqual(simpleUsersAtBegin);
  });
});

describe('POST create user request succeeds when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await helper.addInitialUsersInDb();
  });

  test('all given parameters are given in valid format', async () => {
    const newUserObject = {
      user : {
        name: 'Tiina Tubettaja',
        username: 'tinderi',
        password: 'tinderi123?'
      }
    };

    await api
      .post('/api/users')
      .send(newUserObject)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const users = await helper.usersInDb();

    const names = users.map(r => r.name);

    expect(users).toHaveLength(initEntries.testUsers.length + 1);
    expect(names).toContain('Tiina Tubettaja');
  });

});

describe('DELETE user request', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await helper.addInitialUsersInDb();
  });

  test('removes existing user entry if the user has rights to perform the operation', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    // Verify that the user to be removed is available at the begin.
    const usersAtBegin = await helper.usersInDb();
    const userFoundAtBegin = usersAtBegin.find(u => u.id === decodedToken.id);

    expect(userFoundAtBegin).not.toBeUndefined();

    await api
      .delete(`/api/users/${decodedToken.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(204);

    // Confirm that the user to be removed has been really deleted from the db.
    const usersAtEnd = await helper.usersInDb();
    const userFoundAtEnd = usersAtEnd.find(u => u.id === decodedToken.id);

    expect(userFoundAtEnd).toBeUndefined();

    // Confirm that amount of users in db has decreased by one.
    expect(usersAtEnd.length).toEqual(usersAtBegin.length - 1);
  });
});

describe('PUT user request', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await helper.addInitialUsersInDb();
  });

  test('updates an existing user with given details if the user has rights to perform the operation', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    let allUsers = await helper.usersInDb();

    const userToBeUpdated = {
      name: 'UusiEtunimi UusiSukunimi',
      vehicles: ['5f4e760ec3f7da3743f1577d', '5f4e7616377266866e3b409f', '5f4e761d29a17887a3653411']
    };

    await api
      .put(`/api/users/${decodedToken.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send({ user: userToBeUpdated })
      .expect(200)
      .expect('Content-Type', /application\/json/);

    allUsers = await helper.usersInDb();
    const userAtEnd = allUsers.find(a => a.id === decodedToken.id);
    const vehicleIds = userAtEnd.vehicles.map(v => v.toString());

    // Confirm that the user entry has been updated like expected.
    expect(userAtEnd.name).toBe(userToBeUpdated.name);
    expect(vehicleIds).toContain('5f4e760ec3f7da3743f1577d');
    expect(vehicleIds).toContain('5f4e7616377266866e3b409f');
    expect(vehicleIds).toContain('5f4e761d29a17887a3653411');
  });

  test('updates user password if the user has rights to perform the operation', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    const userAtBegin = await User.findById(decodedToken.id);

    const userToBeUpdated = {
      password: 'secret123?'
    };

    await api
      .put(`/api/users/${decodedToken.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send({ user: userToBeUpdated })
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const userAtEnd = await User.findById(decodedToken.id);

    // Confirm that the password hash of the user has been changed.
    expect(userAtEnd.passwordHash).not.toBe(userAtBegin.passwordHash);

    // Confirm that the user is able to log in with the updated password.
    const loggedInUserAfterUpdate = await helper.loginUser({ user: { username: 'tepsukka', password: 'secret123?' } });
    expect(loggedInUserAfterUpdate).not.toBeUndefined();
  });
});

describe('GET user request error is raised when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await helper.addInitialUsersInDb();
  });

  test('all users are requested but none users found', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    await User.deleteMany({});

    const response = await api
      .get('/api/users')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(404);

    expect(response.body.error).toContain('users not found');
  });

  test('the user is requested but the record is not found', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const id = await helper.nonExistingUserId();

    const response = await api
      .get(`/api/users/${id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(404);

    expect(response.body.error).toContain('user not found');
  });

  test('simple user list is requested WITHOUT TOKEN', async () => {
    const response = await api
      .get('/api/users/simple')
      .set('Authorization', 'bearer')
      .expect(401)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('bearer is missing');
  });

  test('simple user list is requested with INVALID TOKEN', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const invalidToken = loggedInUser.token.slice(0, -1);

    const response = await api
      .get('/api/users/simple')
      .set('Authorization', `bearer ${invalidToken}`)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('invalid token');
  });

  test('simple user list is requested when there is not any users', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    await User.deleteMany({});

    const response = await api
      .get('/api/users/simple')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(404)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('users not found');
  });
});

describe('DELETE user request error is raised when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await helper.addInitialUsersInDb();
  });

  test('trying to delete non-existing user', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    await User.findByIdAndRemove(decodedToken.id);

    const response = await api
      .delete(`/api/users/${decodedToken.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(404);

    expect(response.body.error).toContain('user not found');
  });

  test('delete is requested without user id', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const response = await api
      .delete('/api/users/')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(404);

    expect(response.body.error).toContain('unknown endpoint');
  });

  test('delete is requested with invalid user id', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const id = 'foobar';

    const response = await api
      .delete(`/api/users/${id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(401);

    expect(response.body.error).toContain('unauthorized request');
  });

  test('user does not have rights to perform the operation', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const users = await helper.usersInDb();
    const userToBeRemoved = users.find(u => u.username === 'säpsäkkä');

    const response = await api
      .delete(`/api/users/${userToBeRemoved.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(401);

    expect(response.body.error).toContain('unauthorized request');
  });
});

describe('POST user request error is raised when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await helper.addInitialUsersInDb();
  });

  test('trying to create a new user WITHOUT USERNAME', async () => {
    const newUser = {
      user: {
        name: 'Tiina Tubettaja',
        password: 'tinderi123?'
      }
    };

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory parameters');

    const users = await helper.usersInDb();

    const names = users.map(r => r.name);

    expect(users).toHaveLength(initEntries.testUsers.length);
    expect(names).not.toContain('Tiina Tubettaja');
  });

  test('trying to create a new user WITHOUT NAME', async () => {
    const newUser = {
      user: {
        username: 'tinderi',
        password: 'tinderi123?'
      }
    };

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory parameters');

    const users = await helper.usersInDb();

    const usernames = users.map(r => r.username);

    expect(users).toHaveLength(initEntries.testUsers.length);
    expect(usernames).not.toContain('tinderi');
  });

  test('trying to create a new user WITHOUT PASSWORD', async () => {
    const newUser = {
      user: {
        name: 'Tiina Tubettaja',
        username: 'tinderi',
      }
    };

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory parameters');

    const users = await helper.usersInDb();

    const usernames = users.map(r => r.username);

    expect(users).toHaveLength(initEntries.testUsers.length);
    expect(usernames).not.toContain('tinderi');
  });

  test('trying to create a new user with INVALID USER OBJECT', async () => {

    const response = await api
      .post('/api/users')
      .send('foobar')
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory parameters');

    const users = await helper.usersInDb();

    expect(users).toHaveLength(initEntries.testUsers.length);
  });

  test('trying to create a new user with EXISTING USERNAME', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      user: {
        username: 'tepsukka',
        name: 'Teuvo Sukkanen',
        password: 'tepsukka123?'
      }
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result.body.error).toContain('`username` to be unique');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });

  test('trying to create a new user with TOO SHORT NAME', async () => {
    const newUser = {
      user: {
        name: 'Mika',
        username: 'miksuli',
        password: 'miksuli123?'
      }
    };

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('name validation failed');
  });

  test('trying to create a new user with TOO LONG NAME', async () => {
    const newUser = {
      user: {
        name: 'TestUserTestUserTestUserTestUserTestUserTestUserTes', // 51 characters
        username: 'miksuli',
        password: 'miksuli123?'
      }
    };

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('name validation failed');
  });

  test('trying to create a new user with NAME INCLUDING ILLEGAL CHARS', async () => {
    const newUser = {
      user: {
        name: 'M!k@ H0?H0?',
        username: 'miksuli',
        password: 'miksuli123?'
      }
    };

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('name validation failed');
  });

  test('trying to create a new user with TOO SHORT USERNAME', async () => {
    const newUser = {
      user: {
        name: 'Matti Meikäläinen',
        username: 'masa',
        password: 'massukka123?'
      }
    };

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('username validation failed');
  });

  test('trying to create a new user with TOO LONG USERNAME', async () => {
    const newUser = {
      user: {
        name: 'Matti Meikäläinen',
        username: 'massukkamassuk', // 13 characters
        password: 'massukka123?'
      }
    };

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('name validation failed');
  });

  test('trying to create a new user with USERNAME INCLUDING ILLEGAL CHARS', async () => {
    const newUser = {
      user: {
        name: 'Matti Meikäläinen',
        username: 'm1?s@l!',
        password: 'miksuli123?'
      }
    };

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('username validation failed');
  });

  test('trying to create a new user with TOO SHORT PASSWORD', async () => {
    const newUser = {
      user: {
        name: 'Matti Meikäläinen',
        username: 'massukka',
        password: 'm@s0!'
      }
    };

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('password validation failed');
  });

  test('trying to create a new user with TOO LONG PASSWORD', async () => {
    const newUser = {
      user: {
        name: 'Matti Meikäläinen',
        username: 'massukka',
        password: 'massukka123?massukka123?massukka1' // 33 characters
      }
    };

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('password validation failed');
  });

  test('trying to create a new user with PASSWORD NOT FULFILLING REQUIREMENTS', async () => {
    const newUser = {
      user: {
        name: 'Matti Meikäläinen',
        username: 'massukka',
        password: 'toosimplepwd'
      }
    };

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('password validation failed');
  });
});

describe('PUT update user request error is raised, when user has rights to perform the operation', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await helper.addInitialUsersInDb();
  });

  test('and user update is requested WITHOUT USER OBJECT', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    let allUsers = await helper.usersInDb();
    const userAtBegin = allUsers.find(a => a.id === decodedToken.id);

    const response = await api
      .put(`/api/users/${decodedToken.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send('foobar')
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory parameters');

    allUsers = await helper.usersInDb();
    const userAtEnd = allUsers.find(a => a.id === decodedToken.id);

    expect(userAtEnd.name).toBe(userAtBegin.name);
    expect(new Set(userAtEnd.vehicles)).toEqual(new Set(userAtBegin.vehicles));
  });

  test('and user update is requested with EMPTY USER OBJECT', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    let allUsers = await helper.usersInDb();
    const userAtBegin = allUsers.find(a => a.id === decodedToken.id);

    const response = await api
      .put(`/api/users/${decodedToken.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send({ user: {} })
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory parameters');

    allUsers = await helper.usersInDb();
    const userAtEnd = allUsers.find(a => a.id === decodedToken.id);

    expect(userAtEnd.name).toBe(userAtBegin.name);
    expect(new Set(userAtEnd.vehicles)).toEqual(new Set(userAtBegin.vehicles));
  });

  test('and user update is requested with NON-EXISTING USER ID', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    await User.findByIdAndDelete(decodedToken.id);

    const userToBeUpdated = {
      name: 'UusiEtunimi UusiSukunimi',
      vehicles: ['5f4e760ec3f7da3743f1577d', '5f4e7616377266866e3b409f', '5f4e761d29a17887a3653411']
    };

    const response = await api
      .put(`/api/users/${decodedToken.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send({ user: userToBeUpdated })
      .expect(404)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('user not found');
  });

  test('and user update is requested WITHOUT AUTHORIZATION HEADER', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    const userToBeUpdated = {
      name: 'UusiEtunimi UusiSukunimi',
      vehicles: ['5f4e760ec3f7da3743f1577d', '5f4e7616377266866e3b409f', '5f4e761d29a17887a3653411']
    };

    const response = await api
      .put(`/api/users/${decodedToken.id}/update`)
      .send({ user: userToBeUpdated })
      .expect(401)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('authorization header missing');
  });

  test('and user update is requested with INVALID TOKEN', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);
    const invalidToken = loggedInUser.token.slice(0, -1);

    const userToBeUpdated = {
      name: 'UusiEtunimi UusiSukunimi',
      vehicles: ['5f4e760ec3f7da3743f1577d', '5f4e7616377266866e3b409f', '5f4e761d29a17887a3653411']
    };

    const response = await api
      .put(`/api/users/${decodedToken.id}/update`)
      .set('Authorization', `bearer ${invalidToken}`)
      .send({ user: userToBeUpdated })
      .expect(401)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('invalid token');
  });
});

describe('PUT update user request error is raised, when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await helper.addInitialUsersInDb();
  });

  test('user does not have rights to perform update operation', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const users = await helper.usersInDb();
    const userToBeUpdated = users.find(u => u.username ==='säpsäkkä');

    const updatedUserDetails = {
      name: 'UusiEtunimi UusiSukunimi',
      vehicles: ['5f4e760ec3f7da3743f1577d', '5f4e7616377266866e3b409f', '5f4e761d29a17887a3653411']
    };

    const response = await api
      .put(`/api/users/${userToBeUpdated.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send({ user: updatedUserDetails })
      .expect(401)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('unauthorized request');
  });
});

afterAll(() => {
  db.closeDbConnection();
});