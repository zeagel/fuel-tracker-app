// Establish MongoDB connection
const { MONGODB_URI } = require('./utils/config');
const db = require('./database/database');
db.openDbConnection(MONGODB_URI);

// Take custom middleware functions in use
const mw = require('./utils/middleware');

// Take express library in use for HTTP request handling
const express = require('express');
require('express-async-errors');
const app = express();

// Take CORS in use in order to use BE and FE from same origin
const cors = require('cors');
app.use(cors());

// Take routers in use
const loginRouter = require('./routes/login');
const userRouter = require('./routes/users');
const vehicleRouter = require('./routes/vehicles');
const refuelingRouter = require('./routes/refuelings');

// Set express to use JSON format
app.use(express.json());

// Use desired middlewares
app.use(mw.requestLogger);
//app.use(express.static('build'));

// Define endpoints for desired routes
app.use('/api/login', loginRouter);
app.use('/api/users', userRouter);
app.use('/api/vehicles', vehicleRouter);
app.use('/api/refuelings', refuelingRouter);

// Define additional helper endpoints
app.get('/api/health', (req, res) => {
  res.send('ok');
});

app.get('/api/version', (req, res) => {
  const path = require('path');
  const { name, version } = require(path.join(__dirname, '..', 'package.json'));
  res.send({ name, version });
});

// Handle serving the app when using Client-Side Routing.
// Without this, refresing the current page causes error.
// Approach adapted from here: https://tinyurl.com/y4t6zcap.
const path = require('path');
app.use(express.static(path.join(__dirname, '..', 'build')));
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

// Possible error handling need to be processsed after routing.
app.use(mw.unknownEndpoint);
app.use(mw.errorHandler);

module.exports = app;

