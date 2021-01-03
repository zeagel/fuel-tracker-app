const mongoose = require('mongoose');

const refuelingSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: new Date()
  },
  odoMeter: {
    type: Number,
    required: true
  },
  liters: {
    type: Number,
    required: true
  },
  avgConsumption: Number,
  tripKilometers: Number,
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

refuelingSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

module.exports = mongoose.model('Refueling', refuelingSchema);