const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const token = require('../utils/token');
const User = require('../database/models/user');
const Vehicle = require('../database/models/vehicle');
const Refueling = require('../database/models/refueling');

// ******************************************************************************
// Get all users
router.get('/', async (req, res) => {
  token.verifyToken(req);

  const users = await User.find({})
    .populate({
      path: 'vehicles',
      model: 'Vehicle',
      select: [
        'name',
        'licensePlateId',
        'odoMeter'],
      populate: [{
        path: 'refuelings',
        model: 'Refueling',
        select: [
          'date',
          'odoMeter',
          'liters',
          'tripKilometers',
          'avgConsumption',
          'vehicle'
        ],
        populate: [{
          path: 'user',
          model: 'User',
          select: 'name'
        },
        {
          path: 'vehicle',
          model: 'Vehicle',
          select: ['name', 'licensePlateId']
        }],
      },{
        path: 'coOwners',
        model: 'User',
        select: 'name'
      },{
        path: 'owner',
        model: 'User',
        select: 'name'
      }]
    });

  if (users.length === 0) {
    throw new Error('users not found');
  }

  res.json(users);
});

// ******************************************************************************
// Get simple user list without vehicles data
router.get('/simple', async (req, res) => {
  token.verifyToken(req);

  let users = await User.find({});

  if (users.length === 0) {
    throw new Error('users not found');
  }

  // Drop vehicle arrays away from the user list.
  users = users.map(u => {
    return {
      id: u.id,
      name: u.name,
      username: u.username
    };
  });

  res.json(users);
});

// ******************************************************************************
// Get one user by id
router.get('/:id', async (req, res) => {
  token.verifyToken(req);

  const userId = req.params.id;
  const foundUser = await User.findById(userId)
    .populate({
      path: 'vehicles',
      model: 'Vehicle',
      select: [
        'name',
        'licensePlateId',
        'odoMeter'],
      populate: [{
        path: 'refuelings',
        model: 'Refueling',
        select: [
          'date',
          'odoMeter',
          'liters',
          'tripKilometers',
          'avgConsumption',
          'vehicle'
        ],
        populate: [{
          path: 'user',
          model: 'User',
          select: 'name'
        },
        {
          path: 'vehicle',
          model: 'Vehicle',
          select: [
            'name',
            'licensePlateId',
            'owner'
          ]
        }]
      },{
        path: 'coOwners',
        model: 'User',
        select: 'name'
      },{
        path: 'owner',
        model: 'User',
        select: 'name'
      }]
    });

  if (!foundUser) {
    throw new Error('user not found');
  }

  res.json(foundUser);
});

// ******************************************************************************
// Delete the user based on given user id.
// User is allowed to delete only his own user entry.
router.delete('/:id', async (req, res) => {
  const decodedToken = token.verifyToken(req);

  const userId = req.params.id;

  // Verify does the user have rights to perform delete operation.
  if (decodedToken.id !== userId) {
    throw new Error('unauthorized request');
  }

  const removedUser = await User.findByIdAndDelete(userId);

  if (!removedUser) {
    throw new Error('user not found');
  }

  // When user is deleted, also all vehicles as well as related refuelings,
  // where the user is owner, must be deleted.
  const deleteVehiclesResult = await Vehicle.deleteMany({ owner: userId });
  logger.info('Result of deleted vehicles related to removed user:', deleteVehiclesResult);

  const deleteRefuelingsResult = await Refueling.deleteMany({ user: userId });
  logger.info('Result of deleted refuelings related to removed vehicle owned by removed user:', deleteRefuelingsResult);

  res.status(204).end();
});

// ******************************************************************************
// Add new user
router.post('/', async (req, res) => {

  if (!Object.keys(req.body).includes('user')) {
    throw new Error('missing mandatory parameters');
  }

  const user = req.body.user;

  if (
    !Object.keys(user).includes('name') ||
    !Object.keys(user).includes('username') ||
    !Object.keys(user).includes('password')
  ) {
    throw new Error('missing mandatory parameters');
  }

  if (
    user.name.length < 5 ||
    user.name.length > 50 ||
    !/^\w[a-zA-ZäöåÄÖÅ(\- )]+[\wäöåÄÖÅ]+$/.test(user.name)
  ) {
    throw new Error('name validation failed');
  }

  if (
    user.username.length < 5 ||
    user.username.length > 12 ||
    !/^[\w]*[a-zA-ZäöåÄÖÅ]+[\w]$/.test(user.username)
  ) {
    throw new Error('username validation failed');
  }

  if (
    user.password.length < 6 ||
    user.password.length > 32 ||
    !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]/.test(user.password)
  ) {
    throw new Error('password validation failed');
  }

  // Hash user password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(user.password, saltRounds);

  const newUser = new User({
    'name': user.name,
    'username': user.username,
    passwordHash
  });

  const savedUser = await newUser.save();

  res.json(savedUser);
});

// ******************************************************************************
// Update existing user details. User is allowed to update only his own user entry.
router.put('/:id/update', async (req, res) => {
  const decodedToken = token.verifyToken(req);

  const user = req.body.user;

  if (!user || (!user.name && !user.password && !user.vehicles)) {
    throw new Error('missing mandatory parameters');
  }

  const userId = req.params.id;
  const foundUser = await User.findById(userId);

  if (!foundUser) {
    throw new Error('user not found');
  }

  // Verify does the user has rights to perform update operation.
  if (decodedToken.id !== userId) {
    throw new Error('unauthorized request');
  }

  // Hash user password
  let newPwdHash = undefined;
  if (user.password) {
    const saltRounds = 10;
    newPwdHash = await bcrypt.hash(user.password, saltRounds);
  }

  const userToBeUpdated = {
    name: user.name ? user.name : foundUser.name,
    username: foundUser.username,
    passwordHash: newPwdHash ? newPwdHash : foundUser.passwordHash,
    vehicles: user.vehicles ? user.vehicles : foundUser.vehicles
  };

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    userToBeUpdated,
    { new: true }
  );

  res.status(200).send({ updated: updatedUser.toJSON() }).end();
});

module.exports = router;