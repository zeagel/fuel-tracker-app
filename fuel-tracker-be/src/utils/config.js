require('dotenv').config();

let PORT = process.env.PORT || 3001;
console.log('Config, PORT:', PORT);

let MONGODB_URI = process.env.MONGODB_URI;
console.log('Config, MONGODB_URI:', MONGODB_URI);

if (process.env.NODE_ENV === 'test') {
  MONGODB_URI = process.env.TEST_MONGODB_URI;
  console.log('Config, MONGODB_URI (test):', MONGODB_URI);
}

let JWT_SECRET = process.env.JWT_SECRET;
console.log('Config, JWT_SECRET:', JWT_SECRET);

module.exports = {
  MONGODB_URI,
  PORT,
  JWT_SECRET
};