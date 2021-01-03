const db = require('../src/database/database');
const helper = require('./test_helper');
const logger = require('../src/utils/logger');
const supertest = require('supertest');
const app = require('../src/app');
const api = supertest(app);
const User = require('../src/database/models/user');
const Vehicle = require('../src/database/models/vehicle');
const Refueling = require('../src/database/models/refueling');

beforeEach(async () => {
  await User.deleteMany({});
  await Vehicle.deleteMany({});
  await Refueling.deleteMany({});
  await helper.addInitialRefuelingsInDb();
});

test('An error is provided if trying to access an unknown endpoint', async () => {
  const response = await api
    .post('/api/foobar/')
    .expect(404);

  expect(response.body.error).toContain('unknown endpoint');
});

test('Console info message is displayed via logger `development` mode', async () => {
  process.env.NODE_ENV = 'development';
  console.log = jest.fn();
  logger.info('test message');
  expect(console.log).toHaveBeenCalledWith('test message');
  process.env.NODE_ENV = 'test';
});

test('Console info message is not displayed via logger in `test` mode', async () => {
  console.log = jest.fn();
  logger.info('test message');
  expect(console.log).not.toHaveBeenCalledWith('test message');
});

test('Console error message is displayed via logger', async () => {
  console.error = jest.fn();
  logger.error('test error message');
  expect(console.error).toHaveBeenCalledWith('test error message');
});

afterAll(() => {
  db.closeDbConnection();
});
