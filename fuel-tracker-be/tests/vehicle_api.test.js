const initEntries = require('./data/initEntries');
const db = require('../src/database/database');
const supertest = require('supertest');
const app = require('../src/app');
const helper = require('./test_helper');
const User = require('../src/database/models/user');
const Vehicle = require('../src/database/models/vehicle');
const Refueling = require('../src/database/models/refueling');
const api = supertest(app);

describe('GET all vehicle request', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await helper.addInitialVehiclesInDb();
  });

  test('returns requested vehicles in JSON format', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    await api
      .get('/api/vehicles')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('returns amount of test vehicles that exists in the db', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const response = await api
      .get('/api/vehicles')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(response.body).toHaveLength(initEntries.testVehicles.length);
  });

  test('returns all test vehicle entries that have created in the db', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const response = await api
      .get('/api/vehicles')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const names = response.body.map(r => r.name);

    initEntries.testVehicles.forEach(vehicle => {
      expect(names).toContain(vehicle.name);
    });
  });
});

describe('GET one vehicle request', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await helper.addInitialVehiclesInDb();
  });

  test('returns requested vehicle in JSON format', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const vehiclesAtBegin = await helper.vehiclesInDb();
    const vehicleToBeFound = vehiclesAtBegin[0];

    await api
      .get(`/api/vehicles/${vehicleToBeFound.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('returns the vehicle entry that was requested by id', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const vehiclesAtBegin = await helper.vehiclesInDb();
    const vehicleToBeFound = vehiclesAtBegin[0];

    const response = await api
      .get(`/api/vehicles/${vehicleToBeFound.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(response.body.name).toBe(vehicleToBeFound.name);
  });
});

describe('POST new vehicle', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await helper.addInitialVehiclesInDb();
  });

  test('creates a new vehicle entry in db and attaches the vehicle to defined owner', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    const userAtBegin = await User.findById(decodedToken.id);

    const reqObject = {
      vehicle: {
        name: 'Porche 911',
        licensePlateId: 'PRC-911',
        odoMeter: 45231,
      },
      primaryVehicle: false
    };

    const response = await api
      .post('/api/vehicles')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const savedVehicle = response.body.vehicle;
    const primary = response.body.primary;

    // Confirm that:
    // - One new vehicle entry has been added
    // - The new vehicle entry contains values given in the create request
    // - Primary vehicle info has not changed in the response
    const vehicles = await helper.vehiclesInDb();
    const foundVehicle = vehicles.find(v => v.name === reqObject.vehicle.name);

    expect(vehicles).toHaveLength(initEntries.testVehicles.length + 1);
    expect(foundVehicle.licensePlateId).toEqual(reqObject.vehicle.licensePlateId);
    expect(foundVehicle.odoMeter).toEqual(reqObject.vehicle.odoMeter);
    expect(primary).toEqual(userAtBegin.primaryVehicle.toString());

    // Confirm that:
    // - One new vehicle entry has been added in user's vehicle array
    // - User's vehicle array contains created vehicle
    // - User's primary vehicle info has not changed
    const userAtEnd = (await User.findById(userAtBegin.id)).toJSON();

    // Convert array of ObjectIDs to array of Strings
    // in order to use Jest .toContain matcher successfully.
    const vehiclesArray = userAtEnd.vehicles.map(v => v.toString());

    expect(userAtEnd.vehicles.length).toEqual(userAtBegin.vehicles.length + 1);
    expect(vehiclesArray).toContain(savedVehicle.id);
    expect(userAtEnd.primaryVehicle).toEqual(userAtBegin.primaryVehicle);
  });

  test('creates a new vehicle entry containing co-owners', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    const userAtBegin = await User.findById(decodedToken.id);

    const coOwnerAtBegin = await User.find({ username: 'säpsäkkä' });

    const reqObject = {
      vehicle: {
        name: 'Porche 911',
        licensePlateId: 'PRC-911',
        odoMeter: 45231,
        coOwners: [coOwnerAtBegin[0]._id]
      },
      primaryVehicle: false
    };

    const response = await api
      .post('/api/vehicles')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const savedVehicle = response.body.vehicle;
    const primary = response.body.primary;

    // Confirm that:
    // - One new vehicle entry has been added
    // - The new vehicle entry contains values given in the create request
    // - Primary vehicle info has not changed in the response
    const vehicles = await helper.vehiclesInDb();
    const foundVehicle = vehicles.find(v => v.name === reqObject.vehicle.name);

    expect(vehicles).toHaveLength(initEntries.testVehicles.length + 1);
    expect(foundVehicle.licensePlateId).toEqual(reqObject.vehicle.licensePlateId);
    expect(foundVehicle.odoMeter).toEqual(reqObject.vehicle.odoMeter);
    expect(primary).toEqual(userAtBegin.primaryVehicle.toString());

    // Confirm that:
    // - One new vehicle entry has been added in user's vehicle array
    // - User's vehicle array contains created vehicle
    // - User's primary vehicle info has not changed
    // - Defined co-owners have been added
    const userAtEnd = (await User.findById(userAtBegin.id)).toJSON();

    // Convert array of ObjectIDs to array of Strings
    // in order to use Jest .toContain matcher successfully.
    const vehiclesArray = userAtEnd.vehicles.map(v => v.toString());

    expect(userAtEnd.vehicles.length).toEqual(userAtBegin.vehicles.length + 1);
    expect(vehiclesArray).toContain(savedVehicle.id);
    expect(userAtEnd.primaryVehicle).toEqual(userAtBegin.primaryVehicle);

    const coOwnersAtEnd = savedVehicle.coOwners.map(co => co.id.toString());
    expect(coOwnersAtEnd).toContain(coOwnerAtBegin[0]._id.toString());
  });

  test('when `primary vehicle´ flag is set ON, marks the created vehicle as primary in the details of the owner', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    const userAtBegin = await User.findById(decodedToken.id);

    const reqObject = {
      vehicle: {
        name: 'Ferrari Spyder',
        licensePlateId: 'SPY-654',
        odoMeter: 12345,
      },
      primaryVehicle: true // set the created vehicle as primary
    };

    const response = await api
      .post('/api/vehicles')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const savedVehicle = response.body.vehicle;
    const primary = response.body.primary;

    // Confirm that:
    // - One new vehicle entry has been added
    // - The new vehicle entry contains values given in the create request
    // - Primary parameter in response contains the id of created vehicle
    const vehicles = await helper.vehiclesInDb();
    const foundVehicle = vehicles.find(v => v.name === reqObject.vehicle.name);

    expect(vehicles).toHaveLength(initEntries.testVehicles.length + 1);
    expect(foundVehicle.licensePlateId).toEqual(reqObject.vehicle.licensePlateId);
    expect(foundVehicle.odoMeter).toEqual(reqObject.vehicle.odoMeter);
    expect(primary).toEqual(savedVehicle.id.toString());

    // Confirm that:
    // - One new vehicle entry has been added in user's vehicle array
    // - User's vehicle array contains created vehicle
    // - User's primary vehicle is now the created vehicle
    const userAtEnd = (await User.findById(userAtBegin.id)).toJSON();

    // Convert array of ObjectIDs to array of Strings
    // in order to use Jest .toContain matcher successfully.
    const vehiclesArray = userAtEnd.vehicles.map(v => v.toString());

    expect(userAtEnd.vehicles.length).toEqual(userAtBegin.vehicles.length + 1);
    expect(vehiclesArray).toContain(savedVehicle.id);
    expect(userAtEnd.primaryVehicle.toString()).toEqual(savedVehicle.id.toString());
  });
});

describe('PUT update vehicle request, performed by owner of the vehicle', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await helper.addInitialVehiclesInDb();
  });

  test('changes all vehicle details (VEHICLE NAME, LICENSE PLATE ID, ODOMETER)', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    // Get vehicle to be updated.
    const allVehicles = await helper.vehiclesInDb();
    const vehicleAtBegin = allVehicles.find(v => v.name === 'Mosse');
    const coOwnersAtBegin = vehicleAtBegin.coOwners.map(co => co.toString());

    // Reset primary vehicle of user and get the record.
    const userAtBegin = await User.findByIdAndUpdate(
      decodedToken.id,
      { primaryVehicle: undefined },
      { new: true }
    );

    // Define request object.
    const reqObject = {
      vehicle: {
        name: 'Nimi Muutettu',
        licensePlateId: 'NMU-888',
        odoMeter: 999999
      },
    };

    const response = await api
      .put(`/api/vehicles/${vehicleAtBegin.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const vehicleAtEnd = response.body.vehicle;
    const primary = response.body.primary;

    const coOwnersAtEnd = vehicleAtEnd.coOwners.map(co => co.id.toString());

    // Confirm that vehicle details have been changed correctly.
    expect(vehicleAtEnd.name).toEqual(reqObject.vehicle.name);
    expect(vehicleAtEnd.licensePlateId).toEqual(reqObject.vehicle.licensePlateId);
    expect(vehicleAtEnd.odoMeter).toEqual(reqObject.vehicle.odoMeter);

    // Confirm that co-owners have not changed.
    expect(coOwnersAtEnd.sort()).toEqual(coOwnersAtBegin.sort());

    // Confirm that primary vehicle has not changed.
    expect(primary).toEqual(userAtBegin.primaryVehicle);
  });

  test('changes only VEHICLE NAME', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    // Get vehicle to be updated.
    const allVehicles = await helper.vehiclesInDb();
    const vehicleAtBegin = allVehicles.find(v => v.name === 'Mosse');
    const coOwnersAtBegin = vehicleAtBegin.coOwners.map(co => co.toString());

    // Reset primary vehicle of user and get the record.
    const userAtBegin = await User.findByIdAndUpdate(
      decodedToken.id,
      { primaryVehicle: undefined },
      { new: true }
    );

    // Define request object.
    const reqObject = {
      vehicle: {
        name: 'Nimi Muutettu'
      },
    };

    const response = await api
      .put(`/api/vehicles/${vehicleAtBegin.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const vehicleAtEnd = response.body.vehicle;
    const primary = response.body.primary;

    const coOwnersAtEnd = vehicleAtEnd.coOwners.map(co => co.id.toString());

    // Confirm that vehicle name has changed correctly.
    expect(vehicleAtEnd.name).toEqual(reqObject.vehicle.name);

    // Confirm that other vehicle details have not changed.
    expect(vehicleAtEnd.licensePlateId).toEqual(vehicleAtBegin.licensePlateId);
    expect(vehicleAtEnd.odoMeter).toEqual(vehicleAtBegin.odoMeter);
    expect(coOwnersAtEnd.sort()).toEqual(coOwnersAtBegin.sort());

    // Confirm that primary vehicle has not changed.
    expect(primary).toEqual(userAtBegin.primaryVehicle);
  });

  test('changes only LICENSE PLATE ID', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    // Get vehicle to be updated.
    const allVehicles = await helper.vehiclesInDb();
    const vechileAtBegin = allVehicles.find(v => v.name === 'Mosse');
    const coOwnersAtBegin = vechileAtBegin.coOwners.map(co => co.toString());

    // Reset primary vehicle of user and get the record.
    const userAtBegin = await User.findByIdAndUpdate(
      decodedToken.id,
      { primaryVehicle: undefined },
      { new: true }
    );

    // Define request object.
    const reqObject = {
      vehicle: {
        licensePlateId: 'CHG-333'
      },
    };

    const response = await api
      .put(`/api/vehicles/${vechileAtBegin.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const vehicleAtEnd = response.body.vehicle;
    const primary = response.body.primary;

    const coOwnersAtEnd = vehicleAtEnd.coOwners.map(co => co.id.toString());

    // Confirm that vehicle license plate id has changed correctly.
    expect(vehicleAtEnd.licensePlateId).toEqual(reqObject.vehicle.licensePlateId);

    // Confirm that other vehicle details have not changed.
    expect(vehicleAtEnd.name).toEqual(vechileAtBegin.name);
    expect(vehicleAtEnd.odoMeter).toEqual(vechileAtBegin.odoMeter);
    expect(coOwnersAtEnd.sort()).toEqual(coOwnersAtBegin.sort());

    // Confirm that primary vehicle has not changed.
    expect(primary).toEqual(userAtBegin.primaryVehicle);
  });

  test('changes only ODOMETER value', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    // Get vehicle to be updated.
    const allVehicles = await helper.vehiclesInDb();
    const vehicleAtBegin = allVehicles.find(v => v.name === 'Mosse');
    const coOwnersAtBegin = vehicleAtBegin.coOwners.map(co => co.toString());

    // Reset primary vehicle of user and get the record.
    const userAtBegin = await User.findByIdAndUpdate(
      decodedToken.id,
      { primaryVehicle: undefined },
      { new: true }
    );

    // Define request object.
    const reqObject = {
      vehicle: {
        odoMeter: 999999
      },
    };

    const response = await api
      .put(`/api/vehicles/${vehicleAtBegin.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const vehicleAtEnd = response.body.vehicle;
    const primary = response.body.primary;

    const coOwnersAtEnd = vehicleAtEnd.coOwners.map(co => co.id.toString());

    // Confirm that vehicle odometer value has changed correctly.
    expect(vehicleAtEnd.odoMeter).toEqual(reqObject.vehicle.odoMeter);

    // Confirm that other vehicle details have not changed.
    expect(vehicleAtEnd.name).toEqual(vehicleAtBegin.name);
    expect(vehicleAtEnd.licensePlateId).toEqual(vehicleAtBegin.licensePlateId);
    expect(coOwnersAtEnd.sort()).toEqual(coOwnersAtBegin.sort());

    // Confirm that primary vehicle has not changed.
    expect(primary).toEqual(userAtBegin.primaryVehicle);
  });

  test('sets the vehicle as primary for the owner', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    // Get vehicle to be updated.
    const allVehicles = await helper.vehiclesInDb();
    const vehicleAtBegin = allVehicles.find(v => v.name === 'Mosse');
    const coOwnersAtBegin = vehicleAtBegin.coOwners.map(co => co.toString());

    // Reset primary vehicle of the owner and get the updated user entry.
    const user = await User.findByIdAndUpdate(
      vehicleAtBegin.owner,
      { primaryVehicle: null },
      { new: true }
    );

    expect(user.primaryVehicle).toEqual(null);

    // Define request object.
    const reqObject = {
      vehicle: {},
      primaryVehicle: vehicleAtBegin.id
    };

    const response = await api
      .put(`/api/vehicles/${vehicleAtBegin.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const vehicleAtEnd = response.body.vehicle;
    const primary = response.body.primary;

    const coOwnersAtEnd = vehicleAtEnd.coOwners.map(co => co.id.toString());

    // Confirm that vehicle details have not been changed.
    expect(vehicleAtEnd.name).toEqual(vehicleAtBegin.name);
    expect(vehicleAtEnd.licensePlateId).toEqual(vehicleAtBegin.licensePlateId);
    expect(vehicleAtEnd.odoMeter).toEqual(vehicleAtBegin.odoMeter);
    expect(coOwnersAtEnd.sort()).toEqual(coOwnersAtBegin.sort());

    // Confirm that primary vehicle has been set correctly.
    expect(primary.toString()).toEqual(vehicleAtBegin.id.toString());
  });

  test('unsets the vehicle as primary from the owner', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    // Get vehicle to be updated.
    const allVehicles = await helper.vehiclesInDb();
    const vehicleAtBegin = allVehicles.find(v => v.name === 'Mosse');
    const coOwnersAtBegin = vehicleAtBegin.coOwners.map(co => co.toString());

    // Set primary vehicle for the owner and get the updated user entry.
    const user = await User.findByIdAndUpdate(
      vehicleAtBegin.owner,
      { primaryVehicle: vehicleAtBegin.id },
      { new: true }
    );

    expect(user.primaryVehicle.toString()).toEqual(vehicleAtBegin.id.toString());

    // Define request object.
    const reqObject = {
      vehicle: {},
      primaryVehicle: null
    };

    const response = await api
      .put(`/api/vehicles/${vehicleAtBegin.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const vehicleAtEnd = response.body.vehicle;
    const primary = response.body.primary;

    const coOwnersAtEnd = vehicleAtEnd.coOwners.map(co => co.id.toString());

    // Confirm that vehicle details have not been changed.
    expect(vehicleAtEnd.name).toEqual(vehicleAtBegin.name);
    expect(vehicleAtEnd.licensePlateId).toEqual(vehicleAtBegin.licensePlateId);
    expect(vehicleAtEnd.odoMeter).toEqual(vehicleAtBegin.odoMeter);
    expect(coOwnersAtEnd.sort()).toEqual(coOwnersAtBegin.sort());

    // Confirm that primary vehicle has been reset.
    expect(primary).toEqual(null);
  });

  test('adds co-owners in the vehicle that does not have any co-owner yet', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    // Get vehicle to be updated.
    const allVehicles = await helper.vehiclesInDb();
    const vehicle = allVehicles.find(v => v.name === 'Mosse');

    // Clear all co-owners from the vehicle.
    const vehicleAtBegin = await Vehicle.findByIdAndUpdate(
      vehicle.id,
      { coOwners: [] },
      { new: true }
    );

    expect(vehicleAtBegin.coOwners.length).toEqual(0);

    // Set primary vehicle for the owner and get the updated user entry.
    const user = await User.findByIdAndUpdate(
      decodedToken.id,
      { primaryVehicle: vehicleAtBegin.id },
      { new: true }
    );

    expect(user.primaryVehicle.toString()).toEqual(vehicleAtBegin.id.toString());

    // Define all other users as co-owners, except the owner of the vehicle,
    // to be added in the vehicle entry.
    const allUsers = await helper.usersInDb();
    const coOwnersToBeAdded = allUsers
      .filter(au => au.id.toString() !== vehicleAtBegin.owner.toString())
      .map(co => co.id);

    // Define request object.
    const reqObject = {
      vehicle: {
        coOwners: coOwnersToBeAdded
      },
      primaryVehicle: user.primaryVehicle
    };

    const response = await api
      .put(`/api/vehicles/${vehicleAtBegin.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const vehicleAtEnd = response.body.vehicle;
    const primary = response.body.primary;

    // Confirm that vehicle details have not been changed.
    expect(vehicleAtEnd.name).toEqual(vehicleAtBegin.name);
    expect(vehicleAtEnd.licensePlateId).toEqual(vehicleAtBegin.licensePlateId);
    expect(vehicleAtEnd.odoMeter).toEqual(vehicleAtBegin.odoMeter);

    // Confirm that primary vehicle has not changed.
    expect(primary.toString()).toEqual(user.primaryVehicle.toString());

    // Confirm that co-owners have been set like requested.
    const coOwnersAtEnd = vehicleAtEnd.coOwners.map(co => co.id);
    expect(coOwnersAtEnd).toEqual(coOwnersToBeAdded);
  });

  test('adds new co-owner in the vehicle that already has some co-owners', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);
    const user = await User.findById(decodedToken.id);

    // Get vehicle to be updated.
    const allVehicles = await helper.vehiclesInDb();
    const vehicle = allVehicles.find(v => v.name === 'Mosse');

    // Set some initial co-owners.
    const foundUsers = await User.find({ username: { $in: ['säpsäkkä', 'sipsakka'] } });
    const coOwnersAtBegin = foundUsers.map(f => f.id.toString());
    const vehicleAtBegin = await Vehicle.findByIdAndUpdate(
      vehicle.id,
      { coOwners: coOwnersAtBegin },
      { new: true }
    );

    expect(vehicleAtBegin.coOwners.length).toEqual(2);

    // Get one new co-owner to be added in the vehicle.
    const newCoOwner = await User.find({ username: 'sepsukka' });
    const coOwnersInReq = [...coOwnersAtBegin, (newCoOwner[0]._id).toString()];

    // Define request object.
    const reqObject = {
      vehicle: {
        coOwners: coOwnersInReq // updated co-owner array
      },
      primaryVehicle: user.primaryVehicle
    };

    const response = await api
      .put(`/api/vehicles/${vehicleAtBegin.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const vehicleAtEnd = response.body.vehicle;
    const primary = response.body.primary;

    // Confirm that vehicle details have not been changed.
    expect(vehicleAtEnd.name).toEqual(vehicleAtBegin.name);
    expect(vehicleAtEnd.licensePlateId).toEqual(vehicleAtBegin.licensePlateId);
    expect(vehicleAtEnd.odoMeter).toEqual(vehicleAtBegin.odoMeter);

    // Confirm that primary vehicle has not changed.
    expect(primary.toString()).toEqual(user.primaryVehicle.toString());

    // Confirm that co-owners have been set like requested.
    const coOwnersAtEnd = vehicleAtEnd.coOwners.map(co => co.id);
    expect(coOwnersAtEnd).toEqual(coOwnersInReq);
  });

  test('removes all co-owners from the vehicle', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    // Get vehicle to be updated.
    const allVehicles = await helper.vehiclesInDb();
    const vehicle = allVehicles.find(v => v.name === 'Mosse');

    // Define all other users as co-owners, except the owner of the vehicle,
    // to be added in the vehicle entry.
    const allUsers = await helper.usersInDb();
    const coOwnersToBeAdded = allUsers
      .filter(au => au.id.toString() !== allVehicles[0].owner.toString())
      .map(co => co.id);

    // Set co-owners in the vehicle entry.
    const vehicleAtBegin = await Vehicle.findByIdAndUpdate(
      vehicle.id,
      { coOwners: coOwnersToBeAdded },
      { new: true }
    );

    const initCoOwners = vehicleAtBegin.coOwners.map(co => co.toString());
    expect(initCoOwners).toEqual(coOwnersToBeAdded);

    // Set primary vehicle for the owner and get the updated user entry.
    const user = await User.findByIdAndUpdate(
      decodedToken.id,
      { primaryVehicle: vehicleAtBegin.id },
      { new: true }
    );

    expect(user.primaryVehicle.toString()).toEqual(vehicleAtBegin.id.toString());

    // Define request object.
    const reqObject = {
      vehicle: {
        coOwners: []
      },
      primaryVehicle: user.primaryVehicle
    };

    const response = await api
      .put(`/api/vehicles/${vehicleAtBegin.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const vehicleAtEnd = response.body.vehicle;
    const primary = response.body.primary;

    // Confirm that vehicle details have not been changed.
    expect(vehicleAtEnd.name).toEqual(vehicleAtBegin.name);
    expect(vehicleAtEnd.licensePlateId).toEqual(vehicleAtBegin.licensePlateId);
    expect(vehicleAtEnd.odoMeter).toEqual(vehicleAtBegin.odoMeter);

    // Confirm that primary vehicle has not changed.
    expect(primary.toString()).toEqual(user.primaryVehicle.toString());

    // Confirm that all co-owners have been removed.
    expect(vehicleAtEnd.coOwners.length).toEqual(0);
  });
});

describe('PUT update vehicle request, performed by co-owner of the vehicle', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await helper.addInitialRefuelingsInDb();
  });

  test('sets the vehicle as primary for the co-owner', async () => {

    // Log in with user that can be added as co-owner in the vehicle.
    const loggedInUser = await helper.loginUser({ user: { username: 'säpsäkkä', password: 'säpsäkkä123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    // Get vehicle to be updated and set the desired co-owner in there.
    const allVehicles = await helper.vehiclesInDb();
    const vehicle = allVehicles.find(v => v.name === 'Mosse');

    const vehicleToBeUpdated = await Vehicle.findByIdAndUpdate(
      vehicle.id,
      { coOwners: [decodedToken.id] },
      { new: true }
    );

    const coOwners = vehicleToBeUpdated.coOwners.map(c => c.toString());

    expect(coOwners).toContain(decodedToken.id.toString());

    // Reset primary vehicle of the co-owner and get the updated user entry.
    const coOwnerAtBegin = await User.findByIdAndUpdate(
      decodedToken.id,
      { primaryVehicle: null },
      { new: true }
    );

    expect(coOwnerAtBegin.primaryVehicle).toEqual(null);

    // Define request object.
    const reqObject = {
      vehicle: {
        name: vehicleToBeUpdated.name,
        licensePlateId: vehicleToBeUpdated.licensePlateId,
        odoMeter: vehicleToBeUpdated.odoMeter,
        coOwners: vehicleToBeUpdated.coOwners
      },
      primaryVehicle: vehicleToBeUpdated.id // edited vehicle is set as primary for the co-owner.
    };

    const response = await api
      .put(`/api/vehicles/${vehicleToBeUpdated.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const vehicleAtEnd = response.body.vehicle;
    const primary = response.body.primary;

    // Confirm that vehicle details have not been changed.
    expect(vehicleAtEnd.name).toEqual(vehicleToBeUpdated.name);
    expect(vehicleAtEnd.licensePlateId).toEqual(vehicleToBeUpdated.licensePlateId);
    expect(vehicleAtEnd.odoMeter).toEqual(vehicleToBeUpdated.odoMeter);

    // Confirm that primary vehicle has been set correctly.
    expect(primary.toString()).toEqual(vehicleToBeUpdated.id.toString());

    // Confirm that the primary vehicle is set correctly in the entry of the co-owner.
    const coOwnerAtEnd = await User.findById(coOwnerAtBegin.id);
    expect(coOwnerAtEnd.primaryVehicle.toString()).toEqual(vehicleToBeUpdated.id.toString());
  });

  test('unsets the vehicle as primary from the co-owner', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'säpsäkkä', password: 'säpsäkkä123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);

    // Get vehicle to be updated and set the desired co-owner in there.
    const allVehicles = await helper.vehiclesInDb();
    const vehicle = allVehicles.find(v => v.name === 'Mosse');

    const vehicleToBeUpdated = await Vehicle.findByIdAndUpdate(
      vehicle.id,
      { coOwners: [decodedToken.id] },
      { new: true }
    );

    const coOwners = vehicleToBeUpdated.coOwners.map(c => c.toString());

    expect(coOwners).toContain(decodedToken.id.toString());

    // Set primary vehicle of the co-owner and get the updated user entry.
    const coOwnerAtBegin = await User.findByIdAndUpdate(
      decodedToken.id,
      { primaryVehicle: vehicleToBeUpdated.id },
      { new: true }
    );

    expect(coOwnerAtBegin.primaryVehicle.toString()).toEqual(vehicleToBeUpdated.id.toString());

    // Define request object.
    const reqObject = {
      vehicle: {
        name: vehicleToBeUpdated.name,
        licensePlateId: vehicleToBeUpdated.licensePlateId,
        odoMeter: vehicleToBeUpdated.odoMeter,
        coOwners: vehicleToBeUpdated.coOwners
      },
      primaryVehicle: undefined // edited vehicle is unset as primary from the co-owner.
    };

    const response = await api
      .put(`/api/vehicles/${vehicleToBeUpdated.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const vehicleAtEnd = response.body.vehicle;
    const primary = response.body.primary;

    // Confirm that vehicle details have not been changed.
    expect(vehicleAtEnd.name).toEqual(vehicleToBeUpdated.name);
    expect(vehicleAtEnd.licensePlateId).toEqual(vehicleToBeUpdated.licensePlateId);
    expect(vehicleAtEnd.odoMeter).toEqual(vehicleToBeUpdated.odoMeter);

    // Confirm that primary vehicle has been correctly set as 'null'.
    expect(primary).toEqual(null);

    // Confirm that the co-owner does not have primary vehicle anymore.
    const coOwnerAtEnd = await User.findById(coOwnerAtBegin.id);
    expect(coOwnerAtEnd.primaryVehicle).toEqual(null);
  });

});

describe('DELETE vehicle', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await helper.addInitialRefuelingsInDb();
  });

  test('removes the vehicle entry, defined by id in the request, from db', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const vehiclesAtBegin = await helper.vehiclesInDb();
    const vehicleToBeRemoved = vehiclesAtBegin.find(v => v.name === 'Mosse');

    await api
      .delete(`/api/vehicles/${vehicleToBeRemoved.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const vehiclesAtEnd = await helper.vehiclesInDb();
    const vehicleNames = vehiclesAtEnd.map(v => v.name);

    expect(vehiclesAtEnd).toHaveLength(vehiclesAtBegin.length - 1);
    expect(vehicleNames).not.toContain(vehicleToBeRemoved.name);
  });

  test('removes the id of deleted vehicle from the vehicle list of the owner', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const vehiclesAtBegin = await helper.vehiclesInDb();
    const vehicleToBeRemoved = vehiclesAtBegin.find(v => v.name === 'Mosse');

    const ownerAtBegin = await User.findById(vehicleToBeRemoved.owner);

    await api
      .delete(`/api/vehicles/${vehicleToBeRemoved.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const ownerAtEnd = await User.findById(vehicleToBeRemoved.owner);
    const vehiclesArray = ownerAtEnd.vehicles.map(v => v.toString());

    expect(ownerAtEnd.vehicles).toHaveLength(ownerAtBegin.vehicles.length - 1);
    expect(vehiclesArray).not.toContain(vehicleToBeRemoved.id);
  });

  test('removes the id of deleted vehicle from the vehicle list of all co-owners', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'sepsukka', password: 'sepsukka123?' } });

    // Get vehicle having some co-owners.
    const vehicles = await helper.vehiclesInDb();
    const vehicleToBeRemoved = vehicles.find(vehicle => vehicle.licensePlateId === 'WAR-333');
    const coOwnersAtBegin = await User.find({ _id: { $in: vehicleToBeRemoved.coOwners } });

    // Confirm that, before removal, the vehicle to be removed is in vehicle list of co-owners.
    coOwnersAtBegin.forEach(coOwner => {
      const vehicleList = coOwner.vehicles.map(v => v.toString());
      expect(vehicleList).toContain(vehicleToBeRemoved.id);
    });

    await api
      .delete(`/api/vehicles/${vehicleToBeRemoved.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const coOwnersAtEnd = await User.find({ _id: { $in: vehicleToBeRemoved.coOwners } });

    // Confirm that, after removal, the vehicle that was removed is not in vehicle list of co-owners anymore.
    coOwnersAtEnd.forEach(coOwner => {
      const vehicleList = coOwner.vehicles.map(v => v.toString());
      expect(vehicleList).not.toContain(vehicleToBeRemoved.id);
    });
  });

  test('removes all refueling entries having the id of deleted vehicle', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'sepsukka', password: 'sepsukka123?' } });

    // Get vehicle having some refuelings.
    const vehicles = await helper.vehiclesInDb();
    const vehicleToBeRemoved = vehicles.find(vehicle => vehicle.licensePlateId === 'WAR-333');

    // Confirm that, before removal, there are refuelings linked to the vehicle to be removed.
    const refuelingsAtBegin = await Refueling.find({ vehicle: vehicleToBeRemoved.id } );
    expect(refuelingsAtBegin.length).toBeGreaterThan(0);

    await api
      .delete(`/api/vehicles/${vehicleToBeRemoved.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    // Confirm that, before removal, there are refuelings linked to the vehicle to be removed.
    const refuelingsAtEnd = await Refueling.find({ vehicle: vehicleToBeRemoved.id } );
    expect(refuelingsAtEnd.length).toBe(0);
  });

  test('reset primary vehicle from owner if the deleted vehicle was set as primary for him', async () => {
    // Log in user who has the deleted vehicle set as primary.
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);
    const userAtBegin = await User.findById(decodedToken.id);

    // Get vehicle to be removed.
    const vehicles = await helper.vehiclesInDb();
    const vehicleToBeRemoved = vehicles.find(vehicle => vehicle.name === 'Mosse');

    expect(userAtBegin.primaryVehicle.toString()).toEqual(vehicleToBeRemoved.id.toString());

    await api
      .delete(`/api/vehicles/${vehicleToBeRemoved.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    // Confirm that primary vehicle of the owner has removed.
    const userAtEnd = await User.findById(decodedToken.id);

    expect(userAtEnd.primaryVehicle).toBe(null);
  });

  test('keep primary vehicle of owne if the deleted vehicle was not set as primary for him', async () => {
    // Log in user who has the deleted vehicle set as primary.
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);
    const userAtBegin = await User.findById(decodedToken.id);

    // Get vehicle to be removed.
    const vehicles = await helper.vehiclesInDb();
    const vehicleToBeRemoved = vehicles.find(vehicle => vehicle.name === 'VW Kupla');

    expect(userAtBegin.primaryVehicle.toString()).not.toEqual(vehicleToBeRemoved.id.toString());

    await api
      .delete(`/api/vehicles/${vehicleToBeRemoved.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    // Confirm that primary vehicle of the owner has removed.
    const userAtEnd = await User.findById(decodedToken.id);

    expect(userAtEnd.primaryVehicle).toEqual(userAtBegin.primaryVehicle);
  });

  test('reset primary vehicle from all co-owners if the deleted vehicle was set as primary for them', async () => {
    // Log in user who owns the vehicle.
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    // Get vehicle to be removed and clear old co-owners.
    const vehicles = await helper.vehiclesInDb();
    let vehicleToBeRemoved = vehicles.find(vehicle => vehicle.name === 'Mosse');
    vehicleToBeRemoved = await Vehicle.findByIdAndUpdate(
      vehicleToBeRemoved.id,
      { coOwners: [] },
      { new: true }
    );

    // Set the vehicle to be removed as primary for selected test co-owners.
    const coOwnerOneAtBegin = await User.findOneAndUpdate(
      { username: 'sipsakka' },
      {
        vehicles: [vehicleToBeRemoved._id],
        primaryVehicle: vehicleToBeRemoved._id
      },
      { new: true }
    );

    const coOwnerTwoAtBegin = await User.findOneAndUpdate(
      { username: 'sepsukka' },
      {
        vehicles: [vehicleToBeRemoved._id],
        primaryVehicle: vehicleToBeRemoved._id
      },
      { new: true }
    );

    // Get also one coOwner that does have some other primary vehicle.
    const vehicle = await Vehicle.find({ name: 'VW Kupla' } );
    const coOwnerThreeAtBegin = await User.findOneAndUpdate(
      { username: 'säpsäkkä' },
      {
        vehicles: [vehicleToBeRemoved._id, vehicle[0]._id],
        primaryVehicle: vehicle[0]._id
      },
      { new: true }
    );

    // Add co-owners in the vehicle to be removed.
    vehicleToBeRemoved = await Vehicle.findByIdAndUpdate(
      vehicleToBeRemoved._id,
      { coOwners: [
        coOwnerOneAtBegin._id,
        coOwnerTwoAtBegin._id,
        coOwnerThreeAtBegin._id
      ] },
      { new: true }
    );

    await api
      .delete(`/api/vehicles/${vehicleToBeRemoved.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const coOwnerOneAtEnd = await User.find({ username: 'sipsakka' });
    const coOwnerTwoAtEnd = await User.find({ username: 'sepsukka' });
    const coOwnerThreeAtEnd = await User.find({ username: 'säpsäkkä' });

    // Confirm that primary vehicle field from correct co-owners has set to null.
    expect(coOwnerOneAtEnd[0].primaryVehicle).toBe(null);
    expect(coOwnerTwoAtEnd[0].primaryVehicle).toBe(null);

    // Confirm that primary vehicle field was not changed if the primary was not the removed one.
    expect(coOwnerThreeAtEnd[0].primaryVehicle.toString()).toEqual(vehicle[0]._id.toString());

    // Confirm that deleted vehicle is not anymore in vehicle list of co-owners.
    expect(coOwnerOneAtEnd[0].vehicles).not.toContain(vehicleToBeRemoved._id);
    expect(coOwnerTwoAtEnd[0].vehicles).not.toContain(vehicleToBeRemoved._id);
    expect(coOwnerThreeAtEnd[0].vehicles).not.toContain(vehicleToBeRemoved._id);
  });
});

describe('GET all vehicles ERROR is raised when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await helper.addInitialVehiclesInDb();
  });

  test('none vehicles found', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    await Vehicle.deleteMany({});

    const response = await api
      .get('/api/vehicles')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(404);

    expect(response.body.error).toContain('vehicles not found');
  });
});

describe('GET one vehicle ERROR is raised when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await helper.addInitialVehiclesInDb();
  });

  test('vehicle not found by given id', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const id = await helper.nonExistingVehicleId();

    const response = await api
      .get(`/api/vehicles/${id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(404);

    expect(response.body.error).toContain('vehicle not found');
  });
});

describe('DELETE vehicle ERROR is raised when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await helper.addInitialVehiclesInDb();
  });

  test('delete is requested with NON-EXISTING ID', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const id = await helper.nonExistingVehicleId();

    const response = await api
      .delete(`/api/vehicles/${id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(404);

    expect(response.body.error).toContain('vehicle not found');
  });

  test('delete is requested WITHOUT ID', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    await api
      .delete('/api/vehicles/')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(404);
  });

  test('delete is requested with INVALID ID', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const invalidVehicleId = 'foobar';

    const response = await api
      .delete(`/api/vehicles/${invalidVehicleId}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(400);

    expect(response.body.error).toContain('malformatted id');
  });

  test('delete is requested WITHOUT TOKEN', async () => {
    const vehicles = await helper.vehiclesInDb();
    const vehicleToBeRemoved = vehicles[0];

    const response = await api
      .delete(`/api/vehicles/${vehicleToBeRemoved.id}`)
      .set('Authorization', 'bearer')
      .expect(401);

    expect(response.body.error).toContain('bearer is missing');
  });

  test('delete is requested with INVALID TOKEN', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const invalidToken = loggedInUser.token.slice(0, -1);

    const vehicles = await helper.vehiclesInDb();
    const vehicleToBeRemoved = vehicles.find(v => v.name === 'Mosse');

    const response = await api
      .delete(`/api/vehicles/${vehicleToBeRemoved.id}`)
      .set('Authorization', `bearer ${invalidToken}`)
      .expect(401);

    expect(response.body.error).toContain('invalid token');
  });

  test('delete is requested by someone else than the owner of the vehicle', async () => {

    // Get the vehicle to be removed (owner=tepsukka).
    const vehicles = await helper.vehiclesInDb();
    const vehicleToBeRemoved = vehicles.find(v => v.name === 'Mosse');

    // Log in with user that is not the owner of the vehicle to be removed.
    const loggedInUser = await helper.loginUser({ user: { username: 'säpsäkkä', password: 'säpsäkkä123?' } });

    const response = await api
      .delete(`/api/vehicles/${vehicleToBeRemoved.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(401);

    // Confirm that the correct error message is displayd.
    expect(response.body.error).toContain('unauthorized request');

    // Confirm that vehicle was not removed.
    const foundVehicle = await Vehicle.findById(vehicleToBeRemoved.id);
    expect(foundVehicle).not.toBe(null);
  });
});

describe('POST create vehicle ERROR is raised when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await helper.addInitialVehiclesInDb();
  });

  test('create is requested WITHOUT VEHICLE NAME', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const vehiclesAtBegin = await helper.vehiclesInDb();

    const reqObject = {
      vehicle: {
        licensePlateId: 'PRC-911',
        odoMeter: 45231
      },
      primaryVehicle: false
    };

    const response = await api
      .post('/api/vehicles')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory vehicle parameters');

    const vehiclesAtEnd = await helper.vehiclesInDb();

    const VehicleLicenses = vehiclesAtEnd.map(v => v.licensePlateId);

    expect(vehiclesAtEnd).toHaveLength(vehiclesAtBegin.length);
    expect(VehicleLicenses).not.toContain('PRC-911');
  });

  test('create is requested WITHOUT VEHICLE OBJECT', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const vehiclesAtBegin = await helper.vehiclesInDb();

    const reqObject = {
      primaryVehicle: false
    };

    const response = await api
      .post('/api/vehicles')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory request parameters');

    const vehiclesAtEnd = await helper.vehiclesInDb();

    expect(vehiclesAtEnd).toHaveLength(vehiclesAtBegin.length);
  });

  test('create is requested with EXISTING LICENSE PLATE ID', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const vehiclesAtBegin = await helper.vehiclesInDb();

    const reqObject = {
      vehicle: {
        name: 'Porche 911',
        licensePlateId: 'MOS-111',
        odoMeter: 45231
      },
      primaryVehicle: false
    };

    const result = await api
      .post('/api/vehicles')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(result.body.error).toContain('`licensePlateId` to be unique');

    const vehiclesAtEnd = await helper.vehiclesInDb();

    expect(vehiclesAtEnd).toHaveLength(vehiclesAtBegin.length);
  });
});

describe('PUT update vehicle request ERROR, performed by owner of the vehicle, is raised when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await helper.addInitialVehiclesInDb();
  });

  test('requesting update WITHOUT VEHICLE ID', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    // Define request object.
    const reqObject = {
      vehicle: {
        name: 'Nimi muutettu'
      },
    };

    const response = await api
      .put('/api/vehicles/update')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(404)
      .expect('Content-Type', /application\/json/);

    // Confirm that the correct error message is thrown.
    expect(response.body.error).toContain('unknown endpoint');
  });

  test('requesting the update WITHOUT VEHICLE OBJECT', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);
    const user = await User.findById(decodedToken.id);

    const allVehicles = await helper.vehiclesInDb();
    const vehicleToBeUpdated = allVehicles.find(v => v.name === 'Mosse');

    // Define request object.
    const reqObject = {
      primaryVehicle: user.primary // primary vehicle is not changed
    };

    const response = await api
      .put(`/api/vehicles/${vehicleToBeUpdated.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    // Confirm that the correct error message is thrown.
    expect(response.body.error).toContain('missing mandatory parameters');

    // Confirm that the name of the vehicle has not been changed.
    const vehicleAtEnd = await Vehicle.findById(vehicleToBeUpdated.id);
    expect(vehicleAtEnd.name).toEqual(vehicleToBeUpdated.name);
  });

  test('requesting the update with NON-EXISTING VEHICLE ID', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);
    const user = await User.findById(decodedToken.id);

    const nonExistingVehicleId = await helper.nonExistingVehicleId();

    // Define request object.
    const reqObject = {
      vehicle: {
        name: 'Nimi muutettu'
      },
      primaryVehicle: user.primary // primary vehicle is not changed
    };

    const response = await api
      .put(`/api/vehicles/${nonExistingVehicleId}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(404)
      .expect('Content-Type', /application\/json/);

    // Confirm that the correct error message is thrown.
    expect(response.body.error).toContain('vehicle not found');
  });

  test('requesting the update with EMPTY VEHICLE OBJECT and WITHOUT PRIMARY VEHICLE', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const vehicleToBeRemoved = await Vehicle.find({ name: 'Mosse' });

    // Define invalid request object; primary vehicle parameter is missing
    const reqObject = {
      vehicle: {},
    };

    const response = await api
      .put(`/api/vehicles/${vehicleToBeRemoved[0]._id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    // Confirm that the correct error message is thrown.
    expect(response.body.error).toContain('missing mandatory parameters');
  });

  test('token is missing', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);
    const user = await User.findById(decodedToken.id);

    const allVehicles = await helper.vehiclesInDb();
    const vehicleToBeUpdated = allVehicles.find(v => v.name === 'Mosse');

    // Define request object.
    const reqObject = {
      vehicle: {
        name: 'Nimi Muutettu',
      },
      primaryVehicle: user.primary // primary vehicle is not changed
    };

    const response = await api
      .put(`/api/vehicles/${vehicleToBeUpdated.id}/update`)
      .set('Authorization', 'bearer')
      .send(reqObject)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    // Confirm that the correct error message is thrown.
    expect(response.body.error).toContain('bearer is missing');

    // Confirm that the name of the vehicle has not been changed.
    const vehicleAtEnd = await Vehicle.findById(vehicleToBeUpdated.id);
    expect(vehicleAtEnd.name).toEqual(vehicleToBeUpdated.name);
  });

  test('token is invalid', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);
    const invalidToken = loggedInUser.token.slice(0, -1);

    const user = await User.findById(decodedToken.id);

    const allVehicles = await helper.vehiclesInDb();
    const vehicleToBeUpdated = allVehicles.find(v => v.name === 'Mosse');

    // Define request object.
    const reqObject = {
      vehicle: {
        name: 'Nimi Muutettu',
      },
      primaryVehicle: user.primary // primary vehicle is not changed
    };

    const response = await api
      .put(`/api/vehicles/${vehicleToBeUpdated.id}/update`)
      .set('Authorization', `bearer ${invalidToken}`)
      .send(reqObject)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    // Confirm that the correct error message is thrown.
    expect(response.body.error).toContain('invalid token');

    // Confirm that the name of the vehicle has not been changed.
    const vehicleAtEnd = await Vehicle.findById(vehicleToBeUpdated.id);
    expect(vehicleAtEnd.name).toEqual(vehicleToBeUpdated.name);
  });
});

describe('PUT update vehicle ERROR, performed by co-owner of the vehicle, is raised when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await helper.addInitialVehiclesInDb();
  });

  test('trying to change VEHICLE NAME', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'säpsäkkä', password: 'säpsäkkä123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);
    const user = await User.findById(decodedToken.id);

    const allVehicles = await helper.vehiclesInDb();
    const vehicleToBeUpdated = allVehicles.find(v => v.name === 'Mosse');

    // Define request object.
    const reqObject = {
      vehicle: {
        name: 'Nimi Muutettu',
      },
      primaryVehicle: user.primary // primary vehicle is not changed
    };

    const response = await api
      .put(`/api/vehicles/${vehicleToBeUpdated.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    // Confirm that the correct error message is thrown.
    expect(response.body.error).toContain('unauthorized request');

    // Confirm that the name of the vehicle has not been changed.
    const vehicleAtEnd = await Vehicle.findById(vehicleToBeUpdated.id);
    expect(vehicleAtEnd.name).toEqual(vehicleToBeUpdated.name);
  });

  test('trying to change LICENSE PLATE ID', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'säpsäkkä', password: 'säpsäkkä123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);
    const user = await User.findById(decodedToken.id);

    const allVehicles = await helper.vehiclesInDb();
    const vehicleToBeUpdated = allVehicles.find(v => v.name === 'Mosse');

    // Define request object.
    const reqObject = {
      vehicle: {
        licensePlateId: 'UUP-123',
      },
      primaryVehicle: user.primary // primary vehicle is not changed
    };

    const response = await api
      .put(`/api/vehicles/${vehicleToBeUpdated.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    // Confirm that the correct error message is thrown.
    expect(response.body.error).toContain('unauthorized request');

    // Confirm that the name of the vehicle has not been changed.
    const vehicleAtEnd = await Vehicle.findById(vehicleToBeUpdated.id);
    expect(vehicleAtEnd.name).toEqual(vehicleToBeUpdated.name);
  });

  test('trying to change ODOMETER value', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'säpsäkkä', password: 'säpsäkkä123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);
    const user = await User.findById(decodedToken.id);

    const allVehicles = await helper.vehiclesInDb();
    const vehicleToBeUpdated = allVehicles.find(v => v.name === 'Mosse');

    // Define request object.
    const reqObject = {
      vehicle: {
        odoMeter: 888888,
      },
      primaryVehicle: user.primary // primary vehicle is not changed
    };

    const response = await api
      .put(`/api/vehicles/${vehicleToBeUpdated.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    // Confirm that the correct error message is thrown.
    expect(response.body.error).toContain('unauthorized request');

    // Confirm that the name of the vehicle has not been changed.
    const vehicleAtEnd = await Vehicle.findById(vehicleToBeUpdated.id);
    expect(vehicleAtEnd.name).toEqual(vehicleToBeUpdated.name);
  });

  test('trying to update co-owner details', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'säpsäkkä', password: 'säpsäkkä123?' } });
    const decodedToken = helper.decodeUserToken(loggedInUser.token);
    const user = await User.findById(decodedToken.id);

    const allVehicles = await helper.vehiclesInDb();
    const vehicleToBeUpdated = allVehicles.find(v => v.name === 'Mosse'); // owned by tepsukka

    const coOwner = await User.find({ username: 'sipsakka' });

    // Define request object.
    const reqObject = {
      vehicle: {
        coOwners: [coOwner.id],
      },
      primaryVehicle: user.primary // primary vehicle is not changed
    };

    const response = await api
      .put(`/api/vehicles/${vehicleToBeUpdated.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(reqObject)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    // Confirm that the correct error message is thrown.
    expect(response.body.error).toContain('unauthorized request');

    // Confirm that the name of the vehicle has not been changed.
    const vehicleAtEnd = await Vehicle.findById(vehicleToBeUpdated.id);
    expect(vehicleAtEnd.name).toEqual(vehicleToBeUpdated.name);
  });
});

afterAll(() => {
  db.closeDbConnection();
});
