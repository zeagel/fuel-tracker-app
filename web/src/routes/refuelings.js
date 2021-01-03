// Add new user
const express = require('express');
const router = express.Router();
const token = require('../utils/token');
const Refueling = require('../database/models/refueling');
const Vehicle = require('../database/models/vehicle');

// ******************************************************************************
// Aux function for checking is the given refueling entry
// the latest one recorded on the vehicle.
const isEntryLatestOne = async (refuelingId) => {
  // Get the vehicle id mapped to the given refueling entry.
  const v = await Refueling.findById(
    refuelingId,
    {
      vehicle: 1,
      _id: 0
    }
  );

  // Abort if none vehicle can be found with given refueling id.
  if(!v) {
    return undefined;
  }

  // Get the latest refueling entry of the vehicle.
  const foundEntry = await Refueling.find({
    vehicle: v.vehicle
  }).sort({
    date: -1 // sort in descending order based on date
  }).limit(1); // limit result group just for one entry (=the latest one)

  // Verify is the given refueling entry the latest one of that vehicle.
  if (foundEntry.length > 0 && refuelingId.toString() === (foundEntry[0]._id).toString()) {
    return true;
  } else {
    return false;
  }
};

// ******************************************************************************
// Get all refuelings
router.get('/', async (req, res) => {
  token.verifyToken(req);

  const refuelings = await Refueling.find({})
    .populate({
      path: 'vehicle',
      model: 'Vehicle',
      select: ['name', 'licensePlateId', 'odoMeter', 'owner'],
      populate: {
        path: 'owner',
        model: 'User',
        select: ['name', 'username']
      }
    })
    .populate({
      path: 'user',
      model: 'User',
      select: ['name', 'username']
    });

  if (refuelings.length === 0) {
    throw new Error('refuelings not found');
  }

  res.json(refuelings);
});

// ******************************************************************************
// Get one refueling by id
router.get('/:id', async (req, res) => {
  token.verifyToken(req);

  const id = req.params.id;
  const foundRefueling = await Refueling.findById(id)
    .populate({
      path: 'vehicle',
      model: 'Vehicle',
      select: ['name', 'licensePlateId', 'odoMeter', 'owner'],
      populate: {
        path: 'owner',
        model: 'User',
        select: ['name', 'username']
      }
    })
    .populate({
      path: 'user',
      model: 'User',
      select: ['name', 'username']
    });

  if (!foundRefueling) {
    throw new Error('refueling not found');
  }

  res.json(foundRefueling);
});

// ******************************************************************************
// Delete refueling entry based on given refueling id.
// Only creator of the entry or the owner of the vehicle is allowed to
// perform the delete operation.
router.delete('/:id', async (req, res) => {
  const decodedToken = token.verifyToken(req);

  const id = req.params.id;

  // Identify is the processed refueling entry the latest one.
  const latestEntry = await isEntryLatestOne(id);
  if (latestEntry === undefined) {
    throw new Error('refueling entry not found');
  }

  // Verify is user allowed to perform delete operation. If not, raise an error.
  const refuelingEntryToBeRemoved = await Refueling.findById(id);
  const vehicle = await Vehicle.findById(refuelingEntryToBeRemoved.vehicle);
  if (
    decodedToken.id.toString() !== refuelingEntryToBeRemoved.user.toString() &&
    decodedToken.id.toString() !== vehicle.owner.toString()
  ) {
    throw new Error('unauthorized request');
  }

  // Delete processed refueling entry.
  const removedRefueling = await Refueling.findByIdAndDelete(id);

  // Delete removed refueling entry also from vehicle's refuelings array
  vehicle.refuelings.splice(vehicle.refuelings.indexOf(id), 1);

  // WHEN the deleted refueling entry is the latest one
  // AND odometer value in deleted refueling entry is equal with
  //   odometer value in the vehicle
  // THEN update vehicle details by substracting trip kilometers
  //   of the refueling entry from the vehicle's odometer value.
  let vehicleOdoUpdated = false;
  if (
    latestEntry &&
    removedRefueling.odoMeter === vehicle.odoMeter
  ) {
    vehicle.odoMeter = vehicle.odoMeter - removedRefueling.tripKilometers;
    vehicleOdoUpdated = true;
  }

  // Save the updated vehicle record.
  await vehicle.save();

  // Send the response with data back to client.
  res.status(200).send({
    removedRefuelingEntry: removedRefueling,
    vehicleOdoUpdated
  }).end();
});

// ******************************************************************************
// Add new refueling entry based on given details.
router.post('/', async (req, res) => {

  const decodedToken = token.verifyToken(req);

  // Make sure that all mandatory parameters are provided.
  // Otherwise, abort with proper error message.
  const refueling = req.body.refueling;

  if (!refueling) {
    throw new Error('missing mandatory parameters');
  }

  const entryType = req.body.refueling.type;
  const vehicleId = req.body.refueling.vehicle;

  if (!entryType || !vehicleId || !refueling.date || !refueling.liters) {
    throw new Error('missing mandatory parameters');
  }

  if (entryType ==='addEnd' && !refueling.odoMeter) {
    throw new Error('missing mandatory parameters');
  }

  if (entryType ==='addMiddle' && !refueling.trip) {
    throw new Error('missing mandatory parameters');
  }

  const vehicle = await Vehicle.findById(vehicleId);

  if (!vehicle) {
    throw new Error('vehicle not found');
  }

  const previousOdoMeter = vehicle.odoMeter;
  let newOdoMeter = undefined;
  let newTrip = undefined;
  let newAvgConsumption = undefined;

  // Identify type of refueling
  if (entryType === 'addEnd') {
    // When type is 'addEnd' the entry is added in the END of refueling list.
    // This means that there is a need to update vehicle's currrent odometer value.

    // Set new odometer based on given value and calculate/set new trip.
    newOdoMeter = refueling.odoMeter;
    newTrip = newOdoMeter - previousOdoMeter;

  } else if (entryType === 'addMiddle') {
    // When type is 'addMiddle' the entry is added in the MIDDLE of refueling list.
    // This means that vehicle's current odometer value won't be updated.

    // Set new odometer to zero and new trip to given value.
    newOdoMeter = 0;
    newTrip = refueling.trip;

  } else {
    // Given refueling type is invalid -> throw an error.
    throw new Error('invalid refueling type');
  }

  // Calculate new average consumption value.
  newAvgConsumption = (refueling.liters / newTrip) * 100;

  // Define new Refueling object.
  const newRefueling = new Refueling({
    date: refueling.date,
    odoMeter: newOdoMeter,
    liters: refueling.liters,
    avgConsumption: newAvgConsumption,
    tripKilometers: newTrip,
    vehicle: vehicle._id,
    user: decodedToken.id
  });

  // Save new refueling entry.
  const savedRefueling = await newRefueling.save();

  // Populate refueler (user) info so that the name of user
  // is available right away when saved refueling is returned.
  savedRefueling
    .populate({
      path: 'user',
      model: 'User',
      select: 'name'
    })
    .populate({
      path: 'vehicle',
      model: 'Vehicle',
      select: ['name', 'licensePlateId']
    })
    .execPopulate();

  // Update vehicle details and
  // - add new refueling entry in the array
  // - add new odoMeter value IF refueling type is 'addEnd'
  vehicle.refuelings = vehicle.refuelings.concat(savedRefueling._id);
  if (entryType === 'addEnd') {
    vehicle.odoMeter = refueling.odoMeter;
  }

  // Save updated vehicle.
  await vehicle.save();

  res.status(200).json({
    entry: savedRefueling,
    type: entryType
  }).end();
});

// ******************************************************************************
// Update existing refueling entry based on given refueling id and updated details.
// The entry can be updated only if the requestor is the originator of the entry
// OR if the requestor is the owner of the vehicle.
router.put('/:id/update', async (req, res) => {
  const decodedToken = token.verifyToken(req);

  const refuelingId = req.params.id;
  const refueling = req.body.refueling;

  // Check that all mandatory parameters are provided.
  if (!refueling || !refuelingId || (
    !refueling.date ||
    !refueling.odoMeter ||
    !refueling.liters ||
    !refueling.trip
  )) {
    throw new Error('missing mandatory arguments');
  }

  // Get the refueling entry to be updated.
  const foundRefueling = await Refueling.findById(refuelingId);
  if (!foundRefueling) {
    throw new Error('refueling entry not found');
  }

  // Identify:
  //   1) is there a need to update vehicle's odometer value AND
  //   2) should there be used provided trip or odometer value.

  let updateVehicleOdoMeter = false;
  let newTrip = undefined;

  const latestEntry = await isEntryLatestOne(refuelingId); // boolean
  const foundVehicle = await Vehicle.findById(foundRefueling.vehicle)
    .populate({
      path: 'refuelings',
      model: 'Refueling',
      select: [
        'date',
        'odoMeter',
        'liters',
        'tripKilometers',
        'avgConsumption',
        'user'
      ]
    });

  if (!foundVehicle) {
    throw new Error('vehicle not found');
  }

  // Verify does the requestor have rights to edit the entry.
  // If not, raise an error.
  if (
    decodedToken.id.toString() !== foundRefueling.user.toString() &&
    decodedToken.id.toString() !== foundVehicle.owner.toString()
  ) {
    throw new Error('unauthorized request');
  }

  // Identify has the date value of the refueling entry changed.
  // Note: Milliseconds are filtered away before comparison because
  // there seems to be tiny differences even the values should be
  // identically. This might relate to db save operations.
  let dateChanged = false;
  if ((foundRefueling.date).toISOString().split('.')[0] !== refueling.date.split('.')[0]) {
    dateChanged = true;
  }

  // Applied rules:
  //   WHEN the refueling entry to be updated is the only one
  //   OR the refueling enrty to be updated is the latest one
  //   AND the date value of the refueling entry to be updated is not changed
  //   THEN vehicle's odometer value must be updated
  //   AND there must be used provided trip value
  //   OTHERWISE vehicle's odometer value remains in original value
  //   AND there must be used provided odometer value
  if (
    foundVehicle.refuelings.length === 1 ||
    (latestEntry && !dateChanged)
  ) {
    updateVehicleOdoMeter = true;
    foundVehicle.odoMeter = refueling.odoMeter;
    await foundVehicle.save();

    newTrip = refueling.odoMeter - (foundRefueling.odoMeter - foundRefueling.tripKilometers);

  } else {
    newTrip = refueling.trip;
  }

  const newAvgConsumption = (refueling.liters / newTrip) * 100;

  const newRefueling = {
    date: new Date(refueling.date),
    odoMeter: refueling.odoMeter,
    liters: refueling.liters,
    avgConsumption: newAvgConsumption,
    tripKilometers: newTrip,
    vehicle: foundRefueling.vehicle,
    user: foundRefueling.user
  };

  const updatedRefueling = await Refueling.findByIdAndUpdate(
    refuelingId,
    newRefueling,
    { new: true }
  )
    .populate({
      path: 'user',
      model: 'User',
      select: 'name'
    })
    .populate({
      path: 'vehicle',
      model: 'Vehicle',
      select: ['name', 'licensePlateId']
    });

  res.status(200).send({
    updatedEntry: updatedRefueling.toJSON(),
    vehicleOdoUpdated: updateVehicleOdoMeter
  }).end();
});

module.exports = router;