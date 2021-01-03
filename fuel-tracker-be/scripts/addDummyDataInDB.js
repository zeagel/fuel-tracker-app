const config = require('../src/utils/config');
const helper = require('../tests/test_helper');
const mongoose = require('mongoose');
const User = require('../src/database/models/user');
const Vehicle = require('../src/database/models/vehicle');
const Refueling = require('../src/database/models/refueling');

const initConnection = (callback) => {
  mongoose.connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  });
  const db = mongoose.connection;
  db.on('error', (err) => {
    console.error('Error while connecting to database:', err);
    process.exit(1);
  });

  db.once('open', () => {
    console.log('=== INITIALIZE DUMMY TEST DATE IN DB ===');
    console.info('- Connected to database');
    callback();
  });
};

const cleanOldEntries = async () => {

  console.log('- Cleaning old entries:');

  await User.deleteMany({}, (err) => {
    if (err) {
      console.log('Error when deleting Users entries:', err);
    }
  });

  await Vehicle.deleteMany({}, (err) => {
    if (err) {
      console.log('Error when deleting Users entries:', err);
    }
  });

  await Refueling.deleteMany({}, (err) => {
    if (err) {
      console.log('Error when deleting Users entries:', err);
    }
  });
};

initConnection(async () => {

  await cleanOldEntries();

  console.log('- Add initial test entries in Users, Vehicles and Refuelings');
  await helper.addInitialRefuelingsInDb();

  mongoose.connection.close();
});


