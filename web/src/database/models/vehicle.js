const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const vehicleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  licensePlateId: {
    type: String,
    required: true,
    unique: true
  },
  odoMeter: {
    type: Number,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coOwners: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  refuelings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Refueling'
    }
  ]
});

vehicleSchema.plugin(uniqueValidator);

vehicleSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

module.exports = mongoose.model('Vehicle', vehicleSchema);