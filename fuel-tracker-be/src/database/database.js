const mongoose = require('mongoose');

const openDbConnection = (uri) => {
  // Connect to MongoDB
  mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true, // Fixes deprecation warning about usage of 'collection.ensureIndex'
    useFindAndModify: false // Make Mongoose use `findOneAndUpdate()`
  })
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((error) => {
      console.log('Error connection to MongoDB:', error.message);
    });
};

const closeDbConnection = () => {
  console.log('Closing MongoDB connection');
  mongoose.connection.close();
};

module.exports = {
  openDbConnection,
  closeDbConnection
};