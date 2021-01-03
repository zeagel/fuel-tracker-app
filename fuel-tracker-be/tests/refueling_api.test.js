const initEntries = require('./data/initEntries');
const db = require('../src/database/database');
const supertest = require('supertest');
const app = require('../src/app');
const helper = require('./test_helper');
const User = require('../src/database/models/user');
const Vehicle = require('../src/database/models/vehicle');
const Refueling = require('../src/database/models/refueling');
const { refuelingsInDb } = require('./test_helper');
const api = supertest(app);

describe('GET all refuelings request', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Refueling.deleteMany({});
    await helper.addInitialRefuelingsInDb();
  });

  test('returns requested refuelings in JSON format', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    await api
      .get('/api/refuelings')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('returns amount of test refuelings that exists in the db', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const response = await api
      .get('/api/refuelings')
      .set('Authorization', `bearer ${loggedInUser.token}`);

    expect(response.body).toHaveLength(initEntries.testRefuelings.length);
  });

  test('returns all test refueling entries that have created in the db', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const response = await api
      .get('/api/refuelings')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200);

    // Drop time and timezone part away from date
    // string '2020-07-01T00:00:00.000Z' and use only date part
    const dates = response.body.map(r => r.date.split('T')[0]);
    dates.sort((a, b) => a.localeCompare(b));

    const expectedDates = initEntries.testRefuelings.map(tr => tr.date);
    expectedDates.sort((a, b) => a.localeCompare(b));

    expect(dates).toEqual(expectedDates);
  });
});

describe('GET one refueling request', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Refueling.deleteMany({});
    await helper.addInitialRefuelingsInDb();
  });

  test('returns the requested refueling entry in JSON format', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const refuelingsAtBegin = await helper.refuelingsInDb();
    const refuelingToBeFound = refuelingsAtBegin[0];

    await api
      .get(`/api/refuelings/${refuelingToBeFound.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);
  });

  test('returns one particular refueling entry when it is requested by id', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const refuelingsAtBegin = await helper.refuelingsInDb();
    const refuelingToBeFound = refuelingsAtBegin[0];

    const response = await api
      .get(`/api/refuelings/${refuelingToBeFound.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(response.body.odoMeter).toBe(refuelingToBeFound.odoMeter);
  });
});

describe('POST add refueling request', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Refueling.deleteMany({});
    await helper.addInitialRefuelingsInDb();
  });

  test('adds a new refueling entry with correctly calculated values in the END of the list', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const vehiclesAtBegin = await helper.vehiclesInDb();
    const vehicle = vehiclesAtBegin[0];

    const givenTrip = 654;
    const givenOdoMeter = vehicle.odoMeter + givenTrip;
    const givenLiters = 33.11;

    const newRefuelingEntry = {
      refueling: {
        type: 'addEnd', // the refueling is added in the end of the list.
        vehicle: vehicle.id,
        date: new Date(),
        odoMeter: givenOdoMeter,
        liters: givenLiters
      }
    };

    const response = await api
      .post('/api/refuelings')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(newRefuelingEntry)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const savedRefueling = response.body;

    // Entry type is correct (addMiddle)
    expect(savedRefueling.type).toEqual('addEnd');

    // Odometer value is correct.
    expect(savedRefueling.entry.odoMeter).toEqual(givenOdoMeter);

    // Trip value is calculated correctly.
    expect(savedRefueling.entry.tripKilometers).toEqual(givenTrip);

    // Average consumption is calculated correctly in the added entry.
    expect(Number(savedRefueling.entry.avgConsumption)).toEqual(
      Number(((givenLiters / givenTrip) * 100))
    );

    const refuelings = await helper.refuelingsInDb();
    const odoMeterValues = refuelings.map(r => r.odoMeter);

    expect(refuelings).toHaveLength(initEntries.testRefuelings.length + 1);
    expect(odoMeterValues).toContain(vehicle.odoMeter + 654);

    const vehiclesAtEnd = await helper.vehiclesInDb();

    // Convert array of ObjectIDs to array of Strings
    // in order to use Jest .toContain matcher successfully.
    const refuelingsArray = vehiclesAtEnd[0].refuelings.map(r => r.toString());

    // One new refueling entry has added.
    expect(vehiclesAtEnd[0].refuelings).toHaveLength(vehicle.refuelings.length + 1);

    // Id of the added refueling entry in the vehicle is correct.
    expect(refuelingsArray).toContain(savedRefueling.entry.id);
  });

  test('adds a new refueling entry with correctly calculated values in the MIDDLE of the list', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const vehiclesAtBegin = await helper.vehiclesInDb();
    const vehicle = vehiclesAtBegin[0];

    const givenLiters = 45.23;
    const givenTrip = 769;

    const newRefuelingEntry = {
      refueling: {
        type: 'addMiddle', // the refueling is added in the middle of the list.
        vehicle: vehicle.id,
        date: new Date(),
        liters: givenLiters,
        trip: givenTrip
      }
    };

    const response = await api
      .post('/api/refuelings')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(newRefuelingEntry)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const savedRefueling = response.body;

    // Entry type is correct (addMiddle)
    expect(savedRefueling.type).toEqual('addMiddle');

    // When adding in the middle of the list, the odometer value is always set to zero.
    expect(savedRefueling.entry.odoMeter).toEqual(0);

    // Average consumption is calculated correctly in the added entry.
    expect(Number(savedRefueling.entry.avgConsumption)).toEqual(
      Number(((givenLiters / givenTrip) * 100))
    );

    const refuelings = await helper.refuelingsInDb();
    const odoMeterValues = refuelings.map(r => r.tripKilometers);

    // One new refueling entry has added.
    expect(refuelings).toHaveLength(initEntries.testRefuelings.length + 1);

    // Trip value of added entry can be found from refueling entries fetched from db.
    expect(odoMeterValues).toContain(givenTrip);

    const vehiclesAtEnd = await helper.vehiclesInDb();

    // Convert array of ObjectIDs to array of Strings
    // in order to use Jest .toContain matcher successfully.
    const refuelingsArray = vehiclesAtEnd[0].refuelings.map(r => r.toString());

    // One new refueling entry has been added in the vehicle.
    expect(vehiclesAtEnd[0].refuelings).toHaveLength(vehicle.refuelings.length + 1);

    // Id of the added refueling entry in the vehicle is correct.
    expect(refuelingsArray).toContain(savedRefueling.entry.id);
  });
});

describe('PUT update refueling request succeeds when user has edit rights', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Refueling.deleteMany({});
    await helper.addInitialRefuelingsInDb();
  });

  test('and the DATE value update is requested', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const vehicles = await helper.vehiclesInDb();
    const vehicle = vehicles.find(v => v.name === 'Mosse');
    const refuelingAtBegin = await Refueling.findById(vehicle.refuelings[0]);

    const dateAtBegin = new Date('2020-11-20');

    const updatedRefuelingEntry = {
      refueling: {
        date: dateAtBegin,
        odoMeter: refuelingAtBegin.odoMeter,
        liters: refuelingAtBegin.liters,
        trip: '0'
      }
    };

    const response = await api
      .put(`/api/refuelings/${refuelingAtBegin.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(updatedRefuelingEntry)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const dateAtEnd = response.body.updatedEntry.date;

    expect(new Date(dateAtEnd)).toEqual(new Date(dateAtBegin));
  });

  test('and the ODOMETER value update is requested', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const vehicles = await helper.vehiclesInDb();
    const vehicle = vehicles.find(v => v.name === 'Mosse');

    const refuelings = await helper.refuelingsInDb();
    const refuelingAtBegin = refuelings.find(
      r => r.id.toString() === vehicle.refuelings[0].toString()
    );

    const odoMeterAtBegin = 999999;

    const updatedRefuelingEntry = {
      refueling: {
        date: refuelingAtBegin.date,
        odoMeter: odoMeterAtBegin,
        liters: refuelingAtBegin.liters,
        trip: '0'
      }
    };

    const response = await api
      .put(`/api/refuelings/${refuelingAtBegin.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(updatedRefuelingEntry)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const odoMeterAtEnd = response.body.updatedEntry.odoMeter;

    expect(odoMeterAtEnd).toEqual(odoMeterAtBegin);
  });

  test('and the LITERS value update is requested', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const vehicles = await helper.vehiclesInDb();
    const vehicle = vehicles.find(v => v.name === 'Mosse');

    const refuelings = await helper.refuelingsInDb();
    const refuelingAtBegin = refuelings.find(
      r => r.id.toString() === vehicle.refuelings[0].toString()
    );

    const litersAtBegin = 66.66;

    const updatedRefuelingEntry = {
      refueling: {
        date: refuelingAtBegin.date,
        odoMeter: refuelingAtBegin.odoMeter,
        liters: litersAtBegin,
        trip: '0'
      }
    };

    const response = await api
      .put(`/api/refuelings/${refuelingAtBegin.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(updatedRefuelingEntry)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const litersAtEnd = response.body.updatedEntry.liters;

    expect(litersAtEnd).toEqual(litersAtBegin);
  });

  test('the TRIP value update is requested', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const vehicles = await helper.vehiclesInDb();
    const vehicle = vehicles.find(v => v.name === 'Mosse');

    const refuelings = await helper.refuelingsInDb();
    // Init entry including vehicle and user ids.
    const initEntry = refuelings.find(
      r => r.id.toString() === vehicle.refuelings[0].toString()
    );

    // Create a couple test refueling entries in order to arrange
    // such test entry which trip value can be updated.
    const newRefuelingEntryOne = new Refueling({
      date: new Date('2020-06-10'),
      odoMeter: 1500,
      liters: 25.25,
      vehicle: initEntry.vehicle,
      user: initEntry.user
    });
    await newRefuelingEntryOne.save();

    // This will be the entry to be updated.
    const newRefuelingEntryTwo = new Refueling({
      date: new Date('2020-07-15'),
      odoMeter: 2500,
      liters: 33.33,
      vehicle: initEntry.vehicle,
      user: initEntry.user
    });
    await newRefuelingEntryTwo.save();

    const newRefuelingEntryThree = new Refueling({
      date: new Date('2020-08-20'),
      odoMeter: 3500,
      liters: 44.44,
      vehicle: initEntry.vehicle,
      user: initEntry.user
    });
    await newRefuelingEntryThree.save();

    // Created test refueling entries must be added also in the vehicle.
    await Vehicle.findByIdAndUpdate(initEntry.vehicle, {
      refuelings: [
        newRefuelingEntryOne.id,
        newRefuelingEntryTwo.id,
        newRefuelingEntryThree.id
      ]
    });

    // Set desired trip.
    const tripAtBegin = 888;

    // Define refueling object for update request.
    const updatedRefuelingEntryTwo = {
      refueling: {
        date: newRefuelingEntryTwo.date,
        odoMeter: newRefuelingEntryTwo.odoMeter,
        liters: newRefuelingEntryTwo.liters,
        trip: tripAtBegin
      }
    };

    const response = await api
      .put(`/api/refuelings/${newRefuelingEntryTwo.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(updatedRefuelingEntryTwo)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const tripAtEnd = response.body.updatedEntry.tripKilometers;

    // Confirm that the trip value in response is equal with the given one.
    expect(tripAtEnd).toEqual(tripAtBegin);
  });

  test('and user is not refueler but user is the owner of the vehicle', async () => {
    // Log in with user who is the owner of the vehicle.
    const loggedInUser = await helper.loginUser({ user: { username: 'sepsukka', password: 'sepsukka123?' } });

    // Get user who has done the refueling entry but who is not the owner of the vehicle.
    const users = await helper.usersInDb();
    const refueler = users.find(u => u.username === 'sipsakka');

    // Get the vehicle having the refueling entry to be modified.
    const vehicles = await helper.vehiclesInDb();
    const vehicle = vehicles.find(v => v.name === 'Wartburg');

    // Get such refueling entry that is created by refueler who is not the owner of the vehicle.
    const refuelings = await helper.refuelingsInDb();
    const refuelingAtBegin = refuelings.find(
      r => (
        r.vehicle.toString() === vehicle.id.toString() &&
        r.user.toString() === refueler.id.toString()
      )
    );

    const dateAtBegin = new Date('2020-11-20');

    const updatedRefuelingEntry = {
      refueling: {
        date: dateAtBegin,
        odoMeter: refuelingAtBegin.odoMeter,
        liters: refuelingAtBegin.liters,
        trip: '0'
      }
    };

    const response = await api
      .put(`/api/refuelings/${refuelingAtBegin.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(updatedRefuelingEntry)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const dateAtEnd = response.body.updatedEntry.date;

    expect(new Date(dateAtEnd)).toEqual(new Date(dateAtBegin));
  });
});

describe('DELETE refueling entry request succeeds when user has delete rights', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Refueling.deleteMany({});
    await helper.addInitialRefuelingsInDb();
  });

  test('and the removal is requested by a valid refuealing id', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const vehicles = await helper.vehiclesInDb();
    const vehicle = vehicles.find(v => v.name === 'Mosse');
    const refuelingToBeRemoved = vehicle.refuelings[0];

    const refuelingsAtBegin = await helper.refuelingsInDb();

    await api
      .delete(`/api/refuelings/${refuelingToBeRemoved}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const refuelingsAtEnd = await helper.refuelingsInDb();
    const removedRefuelingFound = refuelingsAtEnd.find(r => r.id === refuelingToBeRemoved);

    expect(refuelingsAtEnd.length).toEqual(refuelingsAtBegin.length - 1);
    expect(removedRefuelingFound).toEqual(undefined);
  });

  test('and odometer of vehicle IS UPDATED when the removed refueling entry is the latest one and odometer values are equal', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    // Initialize vehicle entry for the test by:
    // - deleted all old refueling entries
    // - creating three new refueling entries
    // - add new refueling entries in the vehicle
    const vehicles = await helper.vehiclesInDb();
    const vehicle = vehicles.find(v => v.name === 'Mosse');

    await Refueling.deleteMany({ vehicle: vehicle.id });

    const refuelingEntryOne = new Refueling({
      date: new Date('2020-06-13'),
      odoMeter: 8000,
      liters: 56.89,
      tripKilometers: 500,
      avgConsumption: (56.89 / 500) * 100,
      vehicle: vehicle.id,
      user: vehicle.owner
    });
    await refuelingEntryOne.save();

    const refuelingEntryTwo = new Refueling({
      date: new Date('2020-07-10'),
      odoMeter: 8750,
      liters: 45.33,
      tripKilometers: 750,
      avgConsumptionAtEnd: (45.33 / 750) * 100,
      vehicle: vehicle.id,
      user: vehicle.owner
    });
    await refuelingEntryTwo.save();

    const refuelingEntryThree = new Refueling({
      date: new Date('2020-08-20'),
      odoMeter: 9645,
      liters: 45.33,
      tripKilometers: 895,
      avgConsumption: (45.33 / 895) * 100,
      vehicle: vehicle.id,
      user: vehicle.owner
    });
    await refuelingEntryThree.save();

    const refuelingsAtBegin = await helper.refuelingsInDb();

    const vehicleAtBegin = await Vehicle.findByIdAndUpdate(vehicle.id, {
      refuelings: [
        refuelingEntryOne.id,
        refuelingEntryTwo.id,
        refuelingEntryThree.id
      ],
      odoMeter: 9645
    }, { new: true });

    const expectedVehicleOdo = vehicleAtBegin.odoMeter - refuelingEntryThree.tripKilometers;

    const response = await api
      .delete(`/api/refuelings/${refuelingEntryThree.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    // Confirm that 'vehicleOdoUpdated' flag is set in response.
    expect(response.body.vehicleOdoUpdated).toEqual(true);

    // Confirm that one entry is gone and that the deleted entry is not anymore available.
    const refuelingsAtEnd = await helper.refuelingsInDb();
    const removedRefuelingFound = refuelingsAtEnd.find(r => r.id === refuelingEntryThree.id);

    expect(refuelingsAtEnd.length).toEqual(refuelingsAtBegin.length - 1);
    expect(removedRefuelingFound).toEqual(undefined);

    // Confirm that vehicle's odometer is updated correctly.
    const vehicleAtEnd = await Vehicle.findById(vehicle.id);

    expect(vehicleAtEnd.odoMeter).toEqual(expectedVehicleOdo);
  });

  test('and odometer of vehicle IS NOT UPDATED when the removed refueling entry is not the latest one', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    // Initialize vehicle entry for the test by:
    // - deleted all old refueling entries
    // - creating three new refueling entries
    // - add new refueling entries in the vehicle
    const vehicles = await helper.vehiclesInDb();
    const vehicle = vehicles.find(v => v.name === 'Mosse');

    await Refueling.deleteMany({ vehicle: vehicle.id });

    const refuelingEntryOne = new Refueling({
      date: new Date('2020-06-13'),
      odoMeter: 8000,
      liters: 56.89,
      tripKilometers: 500,
      avgConsumption: (56.89 / 500) * 100,
      vehicle: vehicle.id,
      user: vehicle.owner
    });
    await refuelingEntryOne.save();

    const refuelingEntryTwo = new Refueling({
      date: new Date('2020-07-10'),
      odoMeter: 8750,
      liters: 45.33,
      tripKilometers: 750,
      avgConsumptionAtEnd: (45.33 / 750) * 100,
      vehicle: vehicle.id,
      user: vehicle.owner
    });
    await refuelingEntryTwo.save();

    const refuelingEntryThree = new Refueling({
      date: new Date('2020-08-20'),
      odoMeter: 9645,
      liters: 45.33,
      tripKilometers: 895,
      avgConsumption: (45.33 / 895) * 100,
      vehicle: vehicle.id,
      user: vehicle.owner
    });
    await refuelingEntryThree.save();

    const refuelingsAtBegin = await helper.refuelingsInDb();

    const vehicleAtBegin = await Vehicle.findByIdAndUpdate(vehicle.id, {
      refuelings: [
        refuelingEntryOne.id,
        refuelingEntryTwo.id,
        refuelingEntryThree.id
      ],
      odoMeter: 9645
    }, { new: true });

    const expectedVehicleOdo = vehicleAtBegin.odoMeter;

    const response = await api
      .delete(`/api/refuelings/${refuelingEntryTwo.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    // Confirm that 'vehicleOdoUpdated' flag is not set in response.
    expect(response.body.vehicleOdoUpdated).toEqual(false);

    // Confirm that one entry is gone and that the deleted entry is not anymore available.
    const refuelingsAtEnd = await helper.refuelingsInDb();
    const removedRefuelingFound = refuelingsAtEnd.find(r => r.id === refuelingEntryTwo.id);

    expect(refuelingsAtEnd.length).toEqual(refuelingsAtBegin.length - 1);
    expect(removedRefuelingFound).toEqual(undefined);

    // Confirm that vehicle's odometer value has not changed.
    const vehicleAtEnd = await Vehicle.findById(vehicle.id);

    expect(vehicleAtEnd.odoMeter).toEqual(expectedVehicleOdo);
  });

  test('and odometer of vehicle IS NOT UPDATED when the removed refueling entry is the latest one but odometer values differs', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    // Initialize vehicle entry for the test by:
    // - deleted all old refueling entries
    // - creating three new refueling entries
    // - add new refueling entries in the vehicle
    const vehicles = await helper.vehiclesInDb();
    const vehicle = vehicles.find(v => v.name === 'Mosse');

    await Refueling.deleteMany({ vehicle: vehicle.id });

    const refuelingEntryOne = new Refueling({
      date: new Date('2020-06-13'),
      odoMeter: 8000,
      liters: 56.89,
      tripKilometers: 500,
      avgConsumption: (56.89 / 500) * 100,
      vehicle: vehicle.id,
      user: vehicle.owner
    });
    await refuelingEntryOne.save();

    const refuelingEntryTwo = new Refueling({
      date: new Date('2020-07-10'),
      odoMeter: 8750,
      liters: 45.33,
      tripKilometers: 750,
      avgConsumptionAtEnd: (45.33 / 750) * 100,
      vehicle: vehicle.id,
      user: vehicle.owner
    });
    await refuelingEntryTwo.save();

    const refuelingEntryThree = new Refueling({
      date: new Date('2020-08-20'),
      odoMeter: 9645,
      liters: 45.33,
      tripKilometers: 895,
      avgConsumption: (45.33 / 895) * 100,
      vehicle: vehicle.id,
      user: vehicle.owner
    });
    await refuelingEntryThree.save();

    const refuelingsAtBegin = await helper.refuelingsInDb();

    const vehicleAtBegin = await Vehicle.findByIdAndUpdate(vehicle.id, {
      refuelings: [
        refuelingEntryOne.id,
        refuelingEntryTwo.id,
        refuelingEntryThree.id
      ],
      odoMeter: 10000
    }, { new: true });

    const expectedVehicleOdo = vehicleAtBegin.odoMeter;

    const response = await api
      .delete(`/api/refuelings/${refuelingEntryThree.id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    // Confirm that 'vehicleOdoUpdated' flag is not set in response.
    expect(response.body.vehicleOdoUpdated).toEqual(false);

    // Confirm that one entry is gone and that the deleted entry is not anymore available.
    const refuelingsAtEnd = await helper.refuelingsInDb();
    const removedRefuelingFound = refuelingsAtEnd.find(r => r.id === refuelingEntryThree.id);

    expect(refuelingsAtEnd.length).toEqual(refuelingsAtBegin.length - 1);
    expect(removedRefuelingFound).toEqual(undefined);

    // Confirm that vehicle's odometer value has not changed.
    const vehicleAtEnd = await Vehicle.findById(vehicle.id);

    expect(vehicleAtEnd.odoMeter).toEqual(expectedVehicleOdo);
  });
});

describe('The odometer value of the vehicle IS UPDATED when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Refueling.deleteMany({});
    await helper.addInitialRefuelingsInDb();
  });

  test('the only refueling entry of the vehicle is updated', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    // Init test by getting a vehicle, clear all earlier refuelings
    // of it, set known odometer value in the vehicle and attach
    // only one known refueling entry in the vehicle.
    const vehicles = await helper.vehiclesInDb();
    const vehicle = vehicles.find(v => v.name === 'Mosse');

    await Refueling.deleteMany({ vehicle: vehicle.id });

    const initTrip = 750;

    const newRefuelingEntry = new Refueling({
      date: new Date('2020-06-10'),
      odoMeter: 2750,
      liters: 45.23,
      tripKilometers: initTrip,
      avgConsumption: ((45.23 / 750) * 100),
      vehicle: vehicle.id,
      user: vehicle.owner
    });
    await newRefuelingEntry.save();

    const initVehicleOdoMeter = 2750;

    await Vehicle.findByIdAndUpdate(vehicle.id, {
      odoMeter: initVehicleOdoMeter,
      refuelings: [newRefuelingEntry.id]
    });

    // Define refueling object for update request.
    const dateAtBegin = new Date('2020-07-23');
    const odoAtBegin = 2899;
    const litersAtBegin = 38.17;
    const expectedTrip = initTrip + (odoAtBegin - initVehicleOdoMeter);
    const expectedAvgConsumption = ((litersAtBegin / expectedTrip) * 100);

    const updatedRefuelingEntry = {
      refueling: {
        date: dateAtBegin,
        odoMeter: odoAtBegin,
        liters: litersAtBegin,
        trip: initTrip
      }
    };

    // Make a test update request with defined request object.
    const response = await api
      .put(`/api/refuelings/${newRefuelingEntry.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(updatedRefuelingEntry)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    // Confirm that refueling values have been updated correctly.
    const dateAtEnd = response.body.updatedEntry.date;
    const odoAtEnd = response.body.updatedEntry.odoMeter;
    const litersAtEnd = response.body.updatedEntry.liters;
    const avgConsumptionAtEnd = response.body.updatedEntry.avgConsumption;

    expect(new Date(dateAtEnd)).toEqual(new Date(dateAtBegin));
    expect(odoAtEnd).toEqual(odoAtBegin);
    expect(litersAtEnd).toEqual(litersAtBegin);
    expect(avgConsumptionAtEnd).toEqual(expectedAvgConsumption);

    // Confirm that 'vehicleOdoUpdated' flag has set.
    expect(response.body.vehicleOdoUpdated).toEqual(true);

    // Confirm that the vehicle's odometer value has been updated accordingly.
    const vehicleAtEnd = await Vehicle.findById(vehicle.id);

    expect(vehicleAtEnd.odoMeter).toEqual(odoAtBegin);
  });

  test('the vehicle has several refueling entries, the refueling entry is the latest one and the date is not changed', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    // Init test by getting a vehicle, clear all earlier refuelings
    // of it, set known odometer value in the vehicle and attach
    // several new refueling entries in the vehicle.
    const vehicles = await helper.vehiclesInDb();
    const vehicle = vehicles.find(v => v.name === 'Mosse');

    await Refueling.deleteMany({ vehicle: vehicle.id });

    const newRefuelingEntryOne = new Refueling({
      date: new Date('2020-06-10'),
      odoMeter: 2750,
      liters: 45.23,
      tripKilometers: 750,
      avgConsumption: ((45.23 / 750) * 100),
      vehicle: vehicle.id,
      user: vehicle.owner
    });
    await newRefuelingEntryOne.save();

    const newRefuelingEntryTwo = new Refueling({
      date: new Date('2020-07-15'),
      odoMeter: 3500,
      liters: 39.11,
      tripKilometers: 750,
      avgConsumption: ((39.11 / 750) * 100),
      vehicle: vehicle.id,
      user: vehicle.owner
    });
    await newRefuelingEntryTwo.save();

    const initTrip = 750;

    const newRefuelingEntryThree = new Refueling({
      date: new Date('2020-08-23'),
      odoMeter: 4250,
      liters: 33.56,
      tripKilometers: initTrip,
      avgConsumption: ((33.56 / 750) * 100),
      vehicle: vehicle.id,
      user: vehicle.owner
    });
    await newRefuelingEntryThree.save();

    const initVehicleOdoMeter = 4250;

    await Vehicle.findByIdAndUpdate(vehicle.id, {
      odoMeter: initVehicleOdoMeter,
      refuelings: [
        newRefuelingEntryOne.id,
        newRefuelingEntryTwo.id,
        newRefuelingEntryThree.id
      ]
    });

    // Define refueling object for update request.
    const dateAtBegin = new Date(newRefuelingEntryThree.date);
    const odoAtBegin = 4673;
    const litersAtBegin = 45.98;
    const expectedTrip = initTrip + (odoAtBegin - initVehicleOdoMeter);
    const expectedAvgConsumption = ((litersAtBegin / expectedTrip) * 100);

    const updatedRefuelingEntry = {
      refueling: {
        date: dateAtBegin,
        odoMeter: odoAtBegin,
        liters: litersAtBegin,
        trip: initTrip
      }
    };

    // Make a test update request with defined request object.
    const response = await api
      .put(`/api/refuelings/${newRefuelingEntryThree.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(updatedRefuelingEntry)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    // Confirm that refueling values have been updated correctly.
    const dateAtEnd = response.body.updatedEntry.date;
    const odoAtEnd = response.body.updatedEntry.odoMeter;
    const litersAtEnd = response.body.updatedEntry.liters;
    const avgConsumptionAtEnd = response.body.updatedEntry.avgConsumption;

    expect(new Date(dateAtEnd)).toEqual(new Date(dateAtBegin));
    expect(odoAtEnd).toEqual(odoAtBegin);
    expect(litersAtEnd).toEqual(litersAtBegin);
    expect(avgConsumptionAtEnd).toEqual(expectedAvgConsumption);

    // Confirm that 'vehicleOdoUpdated' flag has set.
    expect(response.body.vehicleOdoUpdated).toEqual(true);

    // Confirm that the vehicle's odometer value has been updated accordingly.
    const vehicleAtEnd = await Vehicle.findById(vehicle.id);

    expect(vehicleAtEnd.odoMeter).toEqual(odoAtBegin);
  });
});

describe('The odometer value of the vehicle IS NOT UPDATED when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Refueling.deleteMany({});
    await helper.addInitialRefuelingsInDb();
  });

  test('the updated refueling entry is not the only and not the latest', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    // Init test by getting a vehicle, clear all earlier refuelings
    // of it, set known odometer value in the vehicle and attach
    // several new refueling entries in the vehicle.
    const vehicles = await helper.vehiclesInDb();
    const vehicle = vehicles.find(v => v.name === 'Mosse');

    await Refueling.deleteMany({ vehicle: vehicle.id });

    const newRefuelingEntryOne = new Refueling({
      date: new Date('2020-06-10'),
      odoMeter: 2750,
      liters: 45.23,
      tripKilometers: 750,
      avgConsumption: ((45.23 / 750) * 100),
      vehicle: vehicle.id,
      user: vehicle.owner
    });
    await newRefuelingEntryOne.save();

    const newRefuelingEntryTwo = new Refueling({
      date: new Date('2020-07-15'),
      odoMeter: 3500,
      liters: 39.11,
      tripKilometers: 750,
      avgConsumption: ((39.11 / 750) * 100),
      vehicle: vehicle.id,
      user: vehicle.owner
    });
    await newRefuelingEntryTwo.save();

    const newRefuelingEntryThree = new Refueling({
      date: new Date('2020-08-23'),
      odoMeter: 4250,
      liters: 33.56,
      tripKilometers: 750,
      avgConsumption: ((33.56 / 750) * 100),
      vehicle: vehicle.id,
      user: vehicle.owner
    });
    await newRefuelingEntryThree.save();

    const initVehicleOdoMeter = 4250;

    await Vehicle.findByIdAndUpdate(vehicle.id, {
      odoMeter: initVehicleOdoMeter,
      refuelings: [
        newRefuelingEntryOne.id,
        newRefuelingEntryTwo.id,
        newRefuelingEntryThree.id
      ]
    });

    // Define refueling object for update request.
    // Note: in this scenario, user is not able to update odometer.
    // on the UI. Instead, user is able to change the trip value.
    const dateAtBegin = new Date(newRefuelingEntryTwo.date);
    const odoAtBegin = newRefuelingEntryTwo.odoMeter;
    const litersAtBegin = 45.98;
    const tripAtBegin = 825;
    const expectedAvgConsumption = ((litersAtBegin / tripAtBegin) * 100);

    const updatedRefuelingEntry = {
      refueling: {
        date: dateAtBegin,
        odoMeter: odoAtBegin,
        liters: litersAtBegin,
        trip: tripAtBegin
      }
    };

    // Make a test update request with defined request object.
    const response = await api
      .put(`/api/refuelings/${newRefuelingEntryTwo.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(updatedRefuelingEntry)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    // Confirm that refueling values have been updated correctly.
    const dateAtEnd = response.body.updatedEntry.date;
    const odoAtEnd = response.body.updatedEntry.odoMeter;
    const litersAtEnd = response.body.updatedEntry.liters;
    const avgConsumptionAtEnd = response.body.updatedEntry.avgConsumption;

    expect(new Date(dateAtEnd)).toEqual(new Date(dateAtBegin));
    expect(odoAtEnd).toEqual(odoAtBegin);
    expect(litersAtEnd).toEqual(litersAtBegin);
    expect(avgConsumptionAtEnd).toEqual(expectedAvgConsumption);

    // Confirm that 'vehicleOdoUpdated' flag has not set.
    expect(response.body.vehicleOdoUpdated).toEqual(false);

    // Confirm that the vehicle's odometer value remains in original value.
    const vehicleAtEnd = await Vehicle.findById(vehicle.id);

    expect(vehicleAtEnd.odoMeter).toEqual(initVehicleOdoMeter);
  });

  test('the vehicle has several refueling entries, the entry is the latest and the date value is changed', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    // Init test by getting a vehicle, clear all earlier refuelings
    // of it, set known odometer value in the vehicle and attach
    // several new refueling entries in the vehicle.
    const vehicles = await helper.vehiclesInDb();
    const vehicle = vehicles.find(v => v.name === 'Mosse');

    await Refueling.deleteMany({ vehicle: vehicle.id });

    const newRefuelingEntryOne = new Refueling({
      date: new Date('2020-06-10'),
      odoMeter: 2750,
      liters: 45.23,
      tripKilometers: 750,
      avgConsumption: ((45.23 / 750) * 100),
      vehicle: vehicle.id,
      user: vehicle.owner
    });
    await newRefuelingEntryOne.save();

    const newRefuelingEntryTwo = new Refueling({
      date: new Date('2020-07-15'),
      odoMeter: 3500,
      liters: 39.11,
      tripKilometers: 750,
      avgConsumption: ((39.11 / 750) * 100),
      vehicle: vehicle.id,
      user: vehicle.owner
    });
    await newRefuelingEntryTwo.save();

    const newRefuelingEntryThree = new Refueling({
      date: new Date('2020-08-23'),
      odoMeter: 4250,
      liters: 33.56,
      tripKilometers: 750,
      avgConsumption: ((33.56 / 750) * 100),
      vehicle: vehicle.id,
      user: vehicle.owner
    });
    await newRefuelingEntryThree.save();

    const initVehicleOdoMeter = 4250;

    await Vehicle.findByIdAndUpdate(vehicle.id, {
      odoMeter: initVehicleOdoMeter,
      refuelings: [
        newRefuelingEntryOne.id,
        newRefuelingEntryTwo.id,
        newRefuelingEntryThree.id
      ]
    });

    // Define refueling object for update request.
    // Note: in this scenario, user is not able to update odometer.
    // on the UI. Instead, user is able to change the trip value.
    const dateAtBegin = new Date('2020-08-18');
    const odoAtBegin = newRefuelingEntryThree.odoMeter;
    const litersAtBegin = 35.41;
    const tripAtBegin = 731;
    const expectedAvgConsumption = ((litersAtBegin / tripAtBegin) * 100);

    const updatedRefuelingEntry = {
      refueling: {
        date: dateAtBegin,
        odoMeter: odoAtBegin,
        liters: litersAtBegin,
        trip: tripAtBegin
      }
    };

    // Make a test update request with defined request object.
    const response = await api
      .put(`/api/refuelings/${newRefuelingEntryThree.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(updatedRefuelingEntry)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    // Confirm that refueling values have been updated correctly.
    const dateAtEnd = response.body.updatedEntry.date;
    const odoAtEnd = response.body.updatedEntry.odoMeter;
    const litersAtEnd = response.body.updatedEntry.liters;
    const avgConsumptionAtEnd = response.body.updatedEntry.avgConsumption;

    expect(new Date(dateAtEnd)).toEqual(new Date(dateAtBegin));
    expect(odoAtEnd).toEqual(odoAtBegin);
    expect(litersAtEnd).toEqual(litersAtBegin);
    expect(avgConsumptionAtEnd).toEqual(expectedAvgConsumption);

    // Confirm that 'vehicleOdoUpdated' flag has not set.
    expect(response.body.vehicleOdoUpdated).toEqual(false);

    // Confirm that the vehicle's odometer value remains in original value.
    const vehicleAtEnd = await Vehicle.findById(vehicle.id);

    expect(vehicleAtEnd.odoMeter).toEqual(initVehicleOdoMeter);
  });
});

describe('UPDATE refueling error is raised when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Refueling.deleteMany({});
    await helper.addInitialRefuelingsInDb();
  });

  test('the update request is done WITHOUT REFUELING ID', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const updatedRefuelingEntry = {
      refueling: {
        date: new Date('2020-06-14'),
        odoMeter: 87654,
        liters: 45.45,
        trip: 567
      }
    };

    const refuelingId = null;

    const response = await api
      .put(`/api/refuelings/${refuelingId}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(updatedRefuelingEntry)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('malformatted id');
  });

  test('the update request is done with NON-EXISTING REFUELING ID', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const updatedRefuelingEntry = {
      refueling: {
        date: new Date('2020-06-14'),
        odoMeter: 87654,
        liters: 45.45,
        trip: 567
      }
    };

    const refuelingId = await helper.nonExistingRefuelingId();

    const response = await api
      .put(`/api/refuelings/${refuelingId}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(updatedRefuelingEntry)
      .expect(404)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('refueling entry not found');
  });

  test('the update request is done with INVALID REFUELING ID', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const updatedRefuelingEntry = {
      refueling: {
        date: new Date('2020-06-14'),
        odoMeter: 87654,
        liters: 45.45,
        trip: 567
      }
    };

    const refuelingId = 'foobar';

    const response = await api
      .put(`/api/refuelings/${refuelingId}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(updatedRefuelingEntry)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('malformatted id');
  });

  test('the update request is done WITHOUT DATE', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const refuelings = await helper.refuelingsInDb();
    const initEntry = refuelings[0];

    const updatedRefuelingEntry = {
      refueling: {
        //date: new Date('2020-06-14'),
        odoMeter: 87654,
        liters: 45.45,
        trip: 567
      }
    };

    const response = await api
      .put(`/api/refuelings/${initEntry.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(updatedRefuelingEntry)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory arguments');
  });

  test('the update request is done WITHOUT ODOMETER', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const refuelings = await helper.refuelingsInDb();
    const initEntry = refuelings[0];

    const updatedRefuelingEntry = {
      refueling: {
        date: new Date('2020-06-14'),
        //odoMeter: 87654,
        liters: 45.45,
        trip: 567
      }
    };

    const response = await api
      .put(`/api/refuelings/${initEntry.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(updatedRefuelingEntry)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory arguments');
  });

  test('the update request is done WITHOUT LITERS', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const refuelings = await helper.refuelingsInDb();
    const initEntry = refuelings[0];

    const updatedRefuelingEntry = {
      refueling: {
        date: new Date('2020-06-14'),
        odoMeter: 87654,
        //liters: 45.45,
        trip: 567
      }
    };

    const response = await api
      .put(`/api/refuelings/${initEntry.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(updatedRefuelingEntry)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory arguments');
  });

  test('the update request is done WITHOUT TRIP', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const refuelings = await helper.refuelingsInDb();
    const initEntry = refuelings[0];

    const updatedRefuelingEntry = {
      refueling: {
        date: new Date('2020-06-14'),
        odoMeter: 87654,
        liters: 45.45,
        //trip: 567
      }
    };

    const response = await api
      .put(`/api/refuelings/${initEntry.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(updatedRefuelingEntry)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory arguments');
  });

  test('a valid update request is done but the VEHICLE ID in the record is CORRUPTED', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const refuelings = await helper.refuelingsInDb();
    const initEntry = refuelings[0];

    const nonExistingVehicleId = await helper.nonExistingVehicleId();

    await Refueling.findByIdAndUpdate(initEntry.id, { vehicle: nonExistingVehicleId });

    const updatedRefuelingEntry = {
      refueling: {
        date: new Date(),
        odoMeter: 87654,
        liters: 45.45,
        trip: '0'
      }
    };

    const response = await api
      .put(`/api/refuelings/${initEntry.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(updatedRefuelingEntry)
      .expect(404)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('vehicle not found');
  });

  test('the update request is done WITHOUT REFUELING OBJECT', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const refuelings = await helper.refuelingsInDb();
    const initEntry = refuelings[0];

    const updatedRefuelingEntry = {};

    const response = await api
      .put(`/api/refuelings/${initEntry.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(updatedRefuelingEntry)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory arguments');
  });

  test('the update request is done WITHOUT PAYLOAD', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const refuelings = await helper.refuelingsInDb();
    const initEntry = refuelings[0];

    const response = await api
      .put(`/api/refuelings/${initEntry.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory arguments');
  });

  test('the update request is done WITHOUT TOKEN', async () => {
    const refuelings = await helper.refuelingsInDb();
    const initEntry = refuelings[0];

    const updatedRefuelingEntry = {
      refueling: {
        date: new Date('2020-06-14'),
        odoMeter: 87654,
        liters: 45.45,
        trip: 567
      }
    };

    const response = await api
      .put(`/api/refuelings/${initEntry.id}/update`)
      .set('Authorization', 'bearer')
      .send(updatedRefuelingEntry)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('bearer is missing');
  });

  test('the update request is done WITH INVALID TOKEN', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const invalidToken = loggedInUser.token.slice(0, -1);

    const refuelings = await helper.refuelingsInDb();
    const initEntry = refuelings[0];

    const updatedRefuelingEntry = {
      refueling: {
        date: new Date('2020-06-14'),
        odoMeter: 87654,
        liters: 45.45,
        trip: 567
      }
    };

    const response = await api
      .put(`/api/refuelings/${initEntry.id}/update`)
      .set('Authorization', `bearer ${invalidToken}`)
      .send(updatedRefuelingEntry)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('invalid token');
  });

  test('the update is requested by user who does not have edit rights', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'sepsukka', password: 'sepsukka123?' } });

    const vehicles = await helper.vehiclesInDb();
    const vehicle = vehicles.find(v => v.name === 'Mosse');

    const refuelings = await helper.refuelingsInDb();
    const refuelingToBeUpdated = refuelings.find(
      r => r.id.toString() === vehicle.refuelings[0].toString()
    );

    const updatedRefuelingEntry = {
      refueling: {
        date: new Date('2020-08-23'),
        odoMeter: 1845,
        liters: 43.11,
        trip: '0'
      }
    };

    const response = await api
      .put(`/api/refuelings/${refuelingToBeUpdated.id}/update`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(updatedRefuelingEntry)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('unauthorized request');
  });
});

describe('GET refueling error is raised when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Refueling.deleteMany({});
    await helper.addInitialRefuelingsInDb();
  });

  test('all refuelings are requested and none entries found', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    await Refueling.deleteMany({});

    const response = await api
      .get('/api/refuelings')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(404);

    expect(response.body.error).toContain('refuelings not found');
  });

  test('all refuelings are requested without a token', async () => {
    const response = await api
      .get('/api/refuelings')
      .set('Authorization', 'bearer')
      .expect(401);

    expect(response.body.error).toContain('bearer is missing');
  });

  test('all refuelings are requested with invalid token', async () => {
    const token = await helper.getValidToken();
    const invalidToken = token.slice(0, -1);

    const response = await api
      .get('/api/refuelings')
      .set('Authorization', `bearer ${invalidToken}`)
      .expect(401);

    expect(response.body.error).toContain('invalid token');
  });

  test('one refueling is requestes and the entry is not found', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const id = await helper.nonExistingRefuelingId();

    const response = await api
      .get(`/api/refuelings/${id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(404);

    expect(response.body.error).toContain('refueling not found');
  });

  test('one refueling is requested without a token', async () => {
    const refuelings = await helper.refuelingsInDb();
    const refueling = refuelings[0];

    const response = await api
      .get(`/api/refuelings/${refueling.id}`)
      .set('Authorization', 'bearer')
      .expect(401);

    expect(response.body.error).toContain('bearer is missing');
  });

  test('one refueling is requested with invalid token', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const invalidToken = loggedInUser.token.slice(0, -1);

    const refuelings = await helper.refuelingsInDb();
    const refueling = refuelings[0];

    const response = await api
      .get(`/api/refuelings/${refueling.id}`)
      .set('Authorization', `bearer ${invalidToken}`)
      .expect(401);

    expect(response.body.error).toContain('invalid token');
  });
});

describe('DELETE refueling error is raised when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Refueling.deleteMany({});
    await helper.addInitialRefuelingsInDb();
  });

  test('delete refueling entry is requested without refueling id', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const refuelingsAtBegin = refuelingsInDb();

    await api
      .delete('/api/refuelings/')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(404);

    const refuelingsAtEnd = refuelingsInDb();

    expect(refuelingsAtEnd.length).toEqual(refuelingsAtBegin.length);
  });

  test('delete refueling entry is requested with non-existing id', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const id = await helper.nonExistingRefuelingId();

    const response = await api
      .delete(`/api/refuelings/${id}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(404);

    expect(response.body.error).toContain('refueling entry not found');
  });

  test('delete refueling entry is requested without id', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    await api
      .delete('/api/refuelings/')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(404);
  });

  test('delete refueling entry is requested with an invalid id', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const invalidId = 'foobar';

    const response = await api
      .delete(`/api/refuelings/${invalidId}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(400);

    expect(response.body.error).toContain('malformatted id');
  });

  test('delete request does not have a token', async () => {
    const refuelings = await helper.refuelingsInDb();
    const refueling = refuelings[0];

    const response = await api
      .delete(`/api/refuelings/${refueling.id}`)
      .set('Authorization', 'bearer')
      .expect(401);

    expect(response.body.error).toContain('bearer is missing');
  });

  test('delete request contains an invalid token', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const invalidToken = loggedInUser.token.slice(0, -1);

    const refuelings = await helper.refuelingsInDb();
    const refueling = refuelings[0];

    const response = await api
      .delete(`/api/refuelings/${refueling.id}`)
      .set('Authorization', `bearer ${invalidToken}`)
      .expect(401);

    expect(response.body.error).toContain('invalid token');
  });

  test('delete is requested by user who does not have rights to perform delete operation', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'sipsakka', password: 'sipsakka123?' } });

    const vehicles = await helper.vehiclesInDb();
    const vehicle = vehicles.find(v => v.name === 'Mosse');

    const refuelingToBeRemoved = vehicle.refuelings[0];

    const response = await api
      .delete(`/api/refuelings/${refuelingToBeRemoved}`)
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .expect(401);

    expect(response.body.error).toContain('unauthorized request');

  });
});

describe('POST add refueling entry error is raised when', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Refueling.deleteMany({});
    await helper.addInitialRefuelingsInDb();
  });

  test('create is requested without REFUELING OBJECT', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const refuelingsAtBegin = await helper.refuelingsInDb();

    const newRefuelingEntry = {
      /*refueling: {
        type: 'addEnd',
        vehicle: vehiclesAtBegin[0].id,
        date: new Date(),
        odoMeter: 99999,
        liters: 45.45
      }*/
    };

    const response = await api
      .post('/api/refuelings')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(newRefuelingEntry)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory parameters');

    const refuelingsAtEnd = await helper.refuelingsInDb();

    const literValues = refuelingsAtEnd.map(r => r.liters);

    expect(refuelingsAtEnd).toHaveLength(refuelingsAtBegin.length);
    expect(literValues).not.toContain(45.45);
  });

  test('create is requested with type ADD-END and without REFUELING TYPE', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const refuelingsAtBegin = await helper.refuelingsInDb();
    const vehiclesAtBegin = await helper.vehiclesInDb();

    const newRefuelingEntry = {
      refueling: {
        //type: 'addEnd',
        vehicle: vehiclesAtBegin[0].id,
        date: new Date(),
        odoMeter: 99999,
        liters: 45.45
      }
    };

    const response = await api
      .post('/api/refuelings')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(newRefuelingEntry)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory parameters');

    const refuelingsAtEnd = await helper.refuelingsInDb();

    const literValues = refuelingsAtEnd.map(r => r.liters);

    expect(refuelingsAtEnd).toHaveLength(refuelingsAtBegin.length);
    expect(literValues).not.toContain(45.45);
  });

  test('create is requested with type ADD-END and without VEHICLE ID', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const refuelingsAtBegin = await helper.refuelingsInDb();

    const newRefuelingEntry = {
      refueling: {
        type: 'addEnd',
        //vehicle: vehiclesAtBegin[0].id,
        date: new Date(),
        odoMeter: 99999,
        liters: 45.45
      }
    };

    const response = await api
      .post('/api/refuelings')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(newRefuelingEntry)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory parameters');

    const refuelingsAtEnd = await helper.refuelingsInDb();

    const literValues = refuelingsAtEnd.map(r => r.liters);

    expect(refuelingsAtEnd).toHaveLength(refuelingsAtBegin.length);
    expect(literValues).not.toContain(45.45);
  });

  test('create is requested with NON-EXISTING VEHICLE ID', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const nonExistingVehicleId = await helper.nonExistingVehicleId();

    const newRefuelingEntry = {
      refueling: {
        type: 'addEnd',
        vehicle: nonExistingVehicleId,
        date: new Date(),
        odoMeter: 99999,
        liters: 45.45
      }
    };

    const response = await api
      .post('/api/refuelings')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(newRefuelingEntry)
      .expect(404)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('vehicle not found');
  });

  test('create is requested with type ADD-END and without DATE', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const refuelingsAtBegin = await helper.refuelingsInDb();
    const vehiclesAtBegin = await helper.vehiclesInDb();

    const newRefuelingEntry = {
      refueling: {
        type: 'addEnd',
        vehicle: vehiclesAtBegin[0].id,
        //date: new Date(),
        odoMeter: 99999,
        liters: 45.45
      }
    };

    const response = await api
      .post('/api/refuelings')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(newRefuelingEntry)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory parameters');

    const refuelingsAtEnd = await helper.refuelingsInDb();

    const literValues = refuelingsAtEnd.map(r => r.liters);

    expect(refuelingsAtEnd).toHaveLength(refuelingsAtBegin.length);
    expect(literValues).not.toContain(45.45);
  });

  test('create is requested with type ADD-END and without ODOMETER', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const refuelingsAtBegin = await helper.refuelingsInDb();
    const vehiclesAtBegin = await helper.vehiclesInDb();

    const newRefuelingEntry = {
      refueling: {
        type: 'addEnd',
        vehicle: vehiclesAtBegin[0].id,
        date: new Date(),
        //odoMeter: 99999,
        liters: 45.45
      }
    };

    const response = await api
      .post('/api/refuelings')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(newRefuelingEntry)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory parameters');

    const refuelingsAtEnd = await helper.refuelingsInDb();

    const literValues = refuelingsAtEnd.map(r => r.liters);

    expect(refuelingsAtEnd).toHaveLength(refuelingsAtBegin.length);
    expect(literValues).not.toContain(45.45);
  });

  test('create is requested with type ADD-END and without LITERS', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const refuelingsAtBegin = await helper.refuelingsInDb();
    const vehiclesAtBegin = await helper.vehiclesInDb();

    const newRefuelingEntry = {
      refueling: {
        type: 'addEnd',
        vehicle: vehiclesAtBegin[0].id,
        date: new Date(),
        odoMeter: 99999,
        //liters: 45.45
      }
    };

    const response = await api
      .post('/api/refuelings')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(newRefuelingEntry)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory parameters');

    const refuelingsAtEnd = await helper.refuelingsInDb();

    const literValues = refuelingsAtEnd.map(r => r.liters);

    expect(refuelingsAtEnd).toHaveLength(refuelingsAtBegin.length);
    expect(literValues).not.toContain(45.45);
  });

  test('create is requested without payload', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const refuelingsAtBegin = await helper.refuelingsInDb();

    const response = await api
      .post('/api/refuelings')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send({})
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory parameters');

    const refuelingsAtEnd = await helper.refuelingsInDb();

    expect(refuelingsAtEnd).toHaveLength(refuelingsAtBegin.length);
  });

  test('create is requested with type ADD-MIDDLE and without VEHICLE ID', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const refuelingsAtBegin = await helper.refuelingsInDb();

    const newRefuelingEntry = {
      refueling: {
        type: 'addMiddle',
        //vehicle: vehiclesAtBegin[0].id,
        date: new Date(),
        trip: 888,
        liters: 66.66
      }
    };

    const response = await api
      .post('/api/refuelings')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(newRefuelingEntry)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory parameters');

    const refuelingsAtEnd = await helper.refuelingsInDb();

    const literValues = refuelingsAtEnd.map(r => r.liters);

    expect(refuelingsAtEnd).toHaveLength(refuelingsAtBegin.length);
    expect(literValues).not.toContain(45.45);
  });

  test('create is requested with type ADD-MIDDLE and without DATE', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const refuelingsAtBegin = await helper.refuelingsInDb();
    const vehiclesAtBegin = await helper.vehiclesInDb();

    const newRefuelingEntry = {
      refueling: {
        type: 'addMiddle',
        vehicle: vehiclesAtBegin[0].id,
        //date: new Date(),
        trip: 888,
        liters: 66.66
      }
    };

    const response = await api
      .post('/api/refuelings')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(newRefuelingEntry)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory parameters');

    const refuelingsAtEnd = await helper.refuelingsInDb();

    const literValues = refuelingsAtEnd.map(r => r.liters);

    expect(refuelingsAtEnd).toHaveLength(refuelingsAtBegin.length);
    expect(literValues).not.toContain(45.45);
  });

  test('create is requested with type ADD-MIDDLE and without TRIP', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const refuelingsAtBegin = await helper.refuelingsInDb();
    const vehiclesAtBegin = await helper.vehiclesInDb();

    const newRefuelingEntry = {
      refueling: {
        type: 'addMiddle',
        vehicle: vehiclesAtBegin[0].id,
        date: new Date(),
        //trip: 888,
        liters: 66.66
      }
    };

    const response = await api
      .post('/api/refuelings')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(newRefuelingEntry)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory parameters');

    const refuelingsAtEnd = await helper.refuelingsInDb();

    const literValues = refuelingsAtEnd.map(r => r.liters);

    expect(refuelingsAtEnd).toHaveLength(refuelingsAtBegin.length);
    expect(literValues).not.toContain(45.45);
  });

  test('create is requested with type ADD-MIDDLE and without LITERS', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const refuelingsAtBegin = await helper.refuelingsInDb();
    const vehiclesAtBegin = await helper.vehiclesInDb();

    const newRefuelingEntry = {
      refueling: {
        type: 'addMiddle',
        vehicle: vehiclesAtBegin[0].id,
        date: new Date(),
        trip: 888,
        //liters: 66.66
      }
    };

    const response = await api
      .post('/api/refuelings')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(newRefuelingEntry)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('missing mandatory parameters');

    const refuelingsAtEnd = await helper.refuelingsInDb();

    const literValues = refuelingsAtEnd.map(r => r.liters);

    expect(refuelingsAtEnd).toHaveLength(refuelingsAtBegin.length);
    expect(literValues).not.toContain(45.45);
  });

  test('create is requested with an invalid REFUELING TYPE', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const vehiclesAtBegin = await helper.vehiclesInDb();

    const newRefuelingEntry = {
      refueling: {
        type: 'foobar',
        vehicle: vehiclesAtBegin[0].id,
        date: new Date(),
        trip: 888,
        liters: 66.66
      }
    };

    const response = await api
      .post('/api/refuelings')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(newRefuelingEntry)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('invalid refueling type');
  });

  test('create is requested with an INVALID ODOMETER value', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });

    const vehiclesAtBegin = await helper.vehiclesInDb();

    const newRefuelingEntry = {
      refueling: {
        type: 'addEnd',
        vehicle: vehiclesAtBegin[0].id,
        date: new Date(),
        odoMeter: 'foobar',
        trip: '0',
        liters: 66.66
      }
    };

    const response = await api
      .post('/api/refuelings')
      .set('Authorization', `bearer ${loggedInUser.token}`)
      .send(newRefuelingEntry)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('Refueling validation failed');
  });

  test('create is requested without a token', async () => {
    const vehiclesAtBegin = await helper.vehiclesInDb();

    const newRefuelingEntry = {
      refueling: {
        type: 'addMiddle',
        vehicle: vehiclesAtBegin[0].id,
        date: new Date(),
        trip: 888,
        liters: 66.66
      }
    };

    const response = await api
      .post('/api/refuelings')
      .set('Authorization', 'bearer')
      .send(newRefuelingEntry)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('bearer is missing');
  });

  test('create is requested with an invalid token', async () => {
    const loggedInUser = await helper.loginUser({ user: { username: 'tepsukka', password: 'tepsukka123?' } });
    const invalidToken = loggedInUser.token.slice(0, -1);

    const vehiclesAtBegin = await helper.vehiclesInDb();

    const newRefuelingEntry = {
      refueling: {
        type: 'addMiddle',
        vehicle: vehiclesAtBegin[0].id,
        date: new Date(),
        trip: 888,
        liters: 66.66
      }
    };

    const response = await api
      .post('/api/refuelings')
      .set('Authorization', `bearer ${invalidToken}`)
      .send(newRefuelingEntry)
      .expect(401)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('invalid token');
  });
});

afterAll(() => {
  db.closeDbConnection();
});