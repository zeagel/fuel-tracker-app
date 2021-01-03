const logger = require('./logger');

// Custom middleware function for logging requests
const requestLogger = (req, res, next) => {
  logger.info('Method:', req.method);
  logger.info('Path:  ', req.path);
  logger.info('Body:  ', req.body);
  logger.info('---');
  next();
};

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' });
};

// Custom error handler
const errorHandler = (error, req, res, next) => {
  logger.error(`${error.name}: ${error.message}`);

  if (error.name === 'CastError') {
    return res.status(400).send({ error: 'malformatted id' });

  } else if (error.name === 'ValidationError') {
    return res.status(400).send({ error: error.message });

  } else if (error.name === 'Error' && (
    error.message.includes('not found') ||
    error.message.includes('cannot be identified')
  )) {
    return res.status(404).send({ error: error.message });

  } else if (error.name === 'Error' && (
    error.message.includes('missing mandatory') ||
    error.message.includes('refueling type') ||
    error.message.includes('validation failed')
  )) {
    return res.status(400).send({ error: error.message });

  } else if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'invalid token' });

  } else if (error.name === 'Error' && (
    error.message.includes('invalid username') ||
    error.message.includes('token missing') ||
    error.message.includes('unauthorized request') ||
    error.message.includes('authorization') ||
    error.message.includes('bearer')
  )) {
    return res.status(401).send({ error: error.message });
  }

  next(error);
};

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler
};
