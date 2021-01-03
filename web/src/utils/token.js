const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./config');

const verifyToken = (req) => {
  const authorization = req.get('authorization');
  if (!authorization) {
    throw new Error('authorization header missing');
  }

  if (!authorization.toLowerCase().startsWith('bearer ')) {
    throw new Error('bearer is missing');
  }

  const token = authorization.substring(7);

  const decodedToken = jwt.verify(token, JWT_SECRET);

  return decodedToken;
};

module.exports = { verifyToken };