const config = require('../utils/config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = require('express').Router();
const token = require('../utils/token');
const User = require('../database/models/user');

// ******************************************************************************
// Endpoint for log the user in and create a token for him.
router.post('/', async (req, res) => {
  if (!(req.body.user)) {
    throw new Error('missing mandatory arguments');
  }

  const user = req.body.user;

  const foundUser = await User.findOne({ username: user.username });

  const passwordCorrect = foundUser === null
    ? false
    : await bcrypt.compare(user.password, foundUser.passwordHash);

  if (!(foundUser && passwordCorrect)) {
    throw new Error('invalid username or password');
  }

  const userForToken = {
    id: foundUser._id,
    username: foundUser.username,
    name: foundUser.name
  };

  const token = jwt.sign(userForToken, config.JWT_SECRET);

  res
    .status(200)
    .send({ token });

});

// ******************************************************************************
// Endpoint for verifying user password before its update.
router.post('/verify', async (req, res) => {
  const decodedToken = token.verifyToken(req);

  if (!req.body.user || !req.body.user.password) {
    throw new Error('missing mandatory arguments');
  }

  const user = req.body.user;

  const foundUser = await User.findById(decodedToken.id);

  const passwordCorrect = foundUser === null
    ? false
    : await bcrypt.compare(user.password, foundUser.passwordHash);

  if (!(foundUser && passwordCorrect)) {
    throw new Error('invalid username or password');
  }

  res
    .status(204)
    .end();
});

module.exports = router;