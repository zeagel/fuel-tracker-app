const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const token = require('../utils/token');
const Vehicle = require('../database/models/vehicle');
const User = require('../database/models/user');
const Refueling = require('../database/models/refueling');

// ******************************************************************************
// Get all vehicles
router.get('/', async (req, res) => {
  token.verifyToken(req);

  const vehicles = await Vehicle.find({})
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
      ],
      populate: {
        path: 'user',
        model: 'User',
        select: ['name', 'username']
      }
    })
    .populate({
      path: 'owner',
      model: 'User',
      select: 'name'
    })
    .populate({
      path: 'coOwners',
      model: 'User',
      select: 'name'
    });

  if (vehicles.length === 0) {
    throw new Error('vehicles not found');
  }

  res.json(vehicles);
});

// ******************************************************************************
// Get one vehicle by id
router.get('/:id', async (req, res) => {
  token.verifyToken(req);

  const vehicleId = req.params.id;
  const foundVehicle = await Vehicle.findById(vehicleId)
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
      ],
      populate: {
        path: 'user',
        model: 'User',
        select: ['name', 'username']
      }
    })
    .populate({
      path: 'owner',
      model: 'User',
      select: 'name'
    })
    .populate({
      path: 'coOwners',
      model: 'User',
      select: 'name'
    });

  if (!foundVehicle) {
    throw new Error('vehicle not found');
  }

  res.json(foundVehicle);
});

// ******************************************************************************
// Delete vehicle by given id.
// Only owner of the vehicle is allowed to perform delete vehicle operation.
router.delete('/:id', async (req, res) => {
  const decodedToken = token.verifyToken(req);

  const vehicleId = req.params.id;

  // Verify first that the vehicle can be found.
  const vehicleToBeRemoved = await Vehicle.findById(vehicleId);

  if (!vehicleToBeRemoved) {
    throw new Error('vehicle not found');
  }

  // Confirm then that the delete was requested by the owner of the vehicle.
  if (decodedToken.id.toString() !== vehicleToBeRemoved.owner.toString()) {
    throw new Error('unauthorized request');
  }

  // Vehicle found and delete was requested by owner -> vehicle can be removed.
  const removedVehicle = await Vehicle.findByIdAndDelete(vehicleId);

  // Delete removed vehicle also from user's vehicles array
  const user = await User.findById(removedVehicle.owner);
  user.vehicles.splice(user.vehicles.indexOf(vehicleId), 1);

  // Update user's primary vehicle status if deleted vehicle was user's primary vehicle.
  if (user.primaryVehicle !== null && (user.primaryVehicle).toString() === (removedVehicle._id).toString()) {
    user.primaryVehicle = null;
  }

  // Save updated user entry in db.
  await user.save();

  // If there are co-owners, deleted vehicle must be removed also from the
  // vehicle list of all co-owners. As well as from the primary vehicle field
  // if the deleted vehicle was set as primary for the co-owner.
  if (removedVehicle.coOwners.length > 0) {
    const promiseArray = removedVehicle.coOwners.map(async coOwner => {
      const foundCoOwner = await User.findById(coOwner);

      // Remove deleted vehicle from the vehicle list of co-owner.
      foundCoOwner.vehicles.splice(foundCoOwner.vehicles.indexOf(vehicleId), 1);

      // Reset primary vehicle of if it was the deleted vehicle.
      if (foundCoOwner.primaryVehicle !== null && foundCoOwner.primaryVehicle.toString() === vehicleId.toString()) {
        foundCoOwner.primaryVehicle = null;
      }
      await foundCoOwner.save();
    });

    await Promise.all(promiseArray);
  }

  // When vehicle is removed, all refueling entries related
  // the vehicles must be removed as well.
  const result = await Refueling.deleteMany({ vehicle: vehicleId });
  logger.info('Result of refuelings related to removed vehicle:', result);

  res.status(200).send({
    vehicle: removedVehicle,
    primary: user.primaryVehicle
  }).end();
});

// ******************************************************************************
// Add new vehicle in the system.
router.post('/', async (req, res) => {

  const decodedToken = token.verifyToken(req);

  if (
    !Object.keys(req.body).includes('vehicle') ||
    !Object.keys(req.body).includes('primaryVehicle')
  ) {
    throw new Error('missing mandatory request parameters');
  }

  const vehicle = req.body.vehicle;
  const id = decodedToken.id;
  const primary = req.body.primaryVehicle; // boolean

  if (
    !Object.keys(vehicle).includes('name') ||
    !Object.keys(vehicle).includes('licensePlateId') ||
    !Object.keys(vehicle).includes('odoMeter')
  ) {
    throw new Error('missing mandatory vehicle parameters');
  }

  const foundUser = await User.findById(id);

  const newVehicle = new Vehicle({
    name: vehicle.name,
    licensePlateId: vehicle.licensePlateId,
    odoMeter: vehicle.odoMeter,
    owner: foundUser._id,
    refuelings: [],
    coOwners: vehicle.coOwners ? vehicle.coOwners : []
  });

  const savedVehicle = await newVehicle.save();

  // Populate owner and co-owner info so that they are
  // available right away when saved vehicle is returned.
  savedVehicle
    .populate({
      path: 'owner',
      model: 'User',
      select: 'name'
    })
    .populate({
      path: 'coOwners',
      model: 'User',
      select: 'name'
    })
    .execPopulate();

  // Add created vehicle also in user's vehicles array
  foundUser.vehicles = foundUser.vehicles.concat(savedVehicle._id);

  // Set primary vehicle info.
  foundUser.primaryVehicle = primary ? savedVehicle._id : foundUser.primaryVehicle;

  // Save updated user.
  await foundUser.save();

  // If co-owners, the vehicle record must be added for these users as well.
  if (vehicle.coOwners && vehicle.coOwners.length > 0) {
    const promiseArray = vehicle.coOwners.map(async coOwner => {
      const foundCoOwner = await User.findById(coOwner);
      foundCoOwner.vehicles = foundCoOwner.vehicles.concat(savedVehicle._id);
      await foundCoOwner.save();
    });

    await Promise.all(promiseArray);
  }

  res.json({
    vehicle: savedVehicle,
    primary: foundUser.primaryVehicle
  });
});

// ******************************************************************************
// Update existing vehicle based on given id and updated vehicle details.
//
// Limitations:
// - Only owner of the vehicle is allowed to update details of the vehicle.
//   Except the primary vehicle info; this can be modified also co-owners.
//
// Mandatory parameters:
// - vehicle id (url parameter)
// - vehicle object (can empty if only primary vehicle is changed)
// - primaryVehicle (vehicle id or undefined)
//
// Optional parameters:
// - parameters in vehicle object (name, licensePlateId, odoMeter, coOwners)
router.put('/:id/update', async (req, res) => {

  const decodedToken = token.verifyToken(req);

  const vehicleId = req.params.id;

  if (!Object.keys(req.body).includes('vehicle')) {
    throw new Error('missing mandatory parameters');
  }

  const vehicle = req.body.vehicle;

  if (Object.keys(vehicle).length === 0 && !Object.keys(req.body).includes('primaryVehicle')) {
    throw new Error('missing mandatory parameters');
  }

  const primary = req.body.primaryVehicle;

  // Verify that the vehicle, desired to be udpated, can be found.
  const foundVehicle = await Vehicle.findById(vehicleId);

  if (!foundVehicle) {
    throw new Error('vehicle not found');
  }

  // Map co-owners of found vehicle in array of strings in order to perform
  // simple comparison operation below.
  const coOwnersInFoundVehicle = foundVehicle.coOwners.map(c => c.toString());

  // WHEN user is not the owner of the vehicle
  // AND any vehicle detail in the request contains changes
  // THEN 'unauthorized request' error to be raised
  if (
    (decodedToken.id.toString() !== foundVehicle.owner.toString()) &&
    (
      vehicle.name !== foundVehicle.name ||
      vehicle.licensePlateId !== foundVehicle.licensePlateId ||
      vehicle.odoMeter !== foundVehicle.odoMeter ||
      JSON.stringify(vehicle.coOwners.sort()) !== JSON.stringify(coOwnersInFoundVehicle.sort())
    )
  ) {
    throw new Error('unauthorized request');
  }

  const vehicleToBeUpdated = {
    name: vehicle.name ? vehicle.name : foundVehicle.name,
    licensePlateId: vehicle.licensePlateId ? vehicle.licensePlateId : foundVehicle.licensePlateId,
    odoMeter: vehicle.odoMeter ? vehicle.odoMeter : foundVehicle.odoMeter,
    owner: foundVehicle.owner,
    coOwners: vehicle.coOwners ? vehicle.coOwners : foundVehicle.coOwners
  };

  const updatedVehicle = await Vehicle.findByIdAndUpdate(
    vehicleId,
    vehicleToBeUpdated,
    { new: true }
  )
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
      ],
      populate: {
        path: 'user',
        model: 'User',
        select: ['name', 'username']
      }
    })
    .populate({
      path: 'owner',
      model: 'User',
      select: 'name'
    })
    .populate({
      path: 'coOwners',
      model: 'User',
      select: 'name'
    });

  // ==========================================
  // Set primary vehicle info.
  const updatedUser = await User.findByIdAndUpdate(
    decodedToken.id,
    { primaryVehicle: primary ? primary : undefined },
    { new: true }
  );

  // Map also co-owners from updated vehicle in array of strings in order to perform
  // simple comparison operation below when identifying what to do for changed co-owners.
  const coOwnersUpdatedVechile = updatedVehicle.coOwners.map(c => c.id.toString());

  // ==========================================
  // Process co-owners

  // If the vehicle update request contains co-owner changes, we need
  // to sync the status also into the co-owner specific vehicle lists.

  // If co-owner list in the vehicle update request is equal with
  // co-owner list in found vehicle fetched from the database, we
  // don't need to do any co-owner specific updates.
  if (JSON.stringify(coOwnersUpdatedVechile.sort()) !== JSON.stringify(coOwnersInFoundVehicle.sort())) {

    // Identify is there any added co-owners.
    const addedCoOwners = coOwnersUpdatedVechile.filter(vc => {
      const found = coOwnersInFoundVehicle.find(fc => fc === vc);
      if (!found) {
        return vc;
      }
    });

    // When some co-owners have been added on the vehicle, we
    // need to update vehicle list of these co-owners accordinly
    // by ading the vehicle on the co-owner.
    if (addedCoOwners.length > 0) {
      const promiseArray = addedCoOwners.map(async coOwner => {
        const foundCoOwner = await User.findById(coOwner);
        foundCoOwner.vehicles = foundCoOwner.vehicles.concat(foundVehicle._id);
        await foundCoOwner.save();
      });

      await Promise.all(promiseArray);
    }

    // Identify is there any removed co-owners.
    const removedCoOwners = coOwnersInFoundVehicle.filter(fc => {
      const found = coOwnersUpdatedVechile.find(vc => vc === fc);
      if (!found) {
        return fc;
      }
    });

    // When some co-owners have been removed from the vehicle, we
    // need to update vehicle list of these co-owners accordinly
    // by removing the vehicle from the co-owner.
    if (removedCoOwners.length > 0) {
      const promiseArray = removedCoOwners.map(async coOwner => {
        const foundCoOwner = await User.findById(coOwner);
        foundCoOwner.vehicles = foundCoOwner.vehicles.filter(v =>
          v.toString() !== (foundVehicle._id).toString()
        );
        await foundCoOwner.save();
      });

      await Promise.all(promiseArray);
    }
  }

  res.status(200).send({
    vehicle: updatedVehicle.toJSON(),
    primary: updatedUser.primaryVehicle // vehicle id or undefined
  }).end();
});

module.exports = router;