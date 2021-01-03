const initEntries = require('./data/initEntries');
const bcrypt = require('bcrypt');
const supertest = require('supertest');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../src/utils/config');
const User = require('../src/database/models/user');
const Vehicle = require('../src/database/models/vehicle');
const Refueling = require('../src/database/models/refueling');

const app = require('../src/app');
const api = supertest(app);

const addInitialUsersInDb = async () => {

  const promiseArray = initEntries.testUsers.map(async (user) => {

    const passwordHash = await bcrypt.hash(user.password, 10);

    const newUser = new User({
      name: user.name,
      username: user.username,
      passwordHash
    });

    return await newUser.save();

  });

  await Promise.all(promiseArray);
};

const addInitialVehiclesInDb = async () => {

  // Init users first because we need to add owner id in the created vehicle.
  await addInitialUsersInDb();
  const users = await usersInDb();

  // Aux function to get user id.
  const getUserId = (usernameOfUser) => {
    const user = users.find(u => u.username === usernameOfUser);
    return user.id;
  };

  // Aux function to get all co-owner ids linked to vehicle.
  const getCoOwnerIds = (usernameArrayOfCoOwners) => {
    let coOwnerIds = [];
    usernameArrayOfCoOwners.forEach(username => {
      const foundUser = users.find(u => u.username === username);
      if (foundUser) {
        coOwnerIds.push(foundUser.id);
      }
    });
    return coOwnerIds;
  };

  // Aux function to get vehicle id.
  const getVehicleId = (nameOfVehicle) => {
    const vehicle = vehicles.find(v => v.name === nameOfVehicle);
    if (vehicle) {
      return vehicle.id;
    }
    return undefined;
  };

  // Add init vehicles in database based on definitions in initEntries.
  let promiseArray = initEntries.testVehicles.map(async (vehicle) => {

    // Define new Vehicle object.
    const newVehicle = new Vehicle({
      name: vehicle.name,
      licensePlateId: vehicle.licensePlateId,
      odoMeter: vehicle.odoMeter,
      owner: getUserId(vehicle.owner),
      coOwners: getCoOwnerIds(vehicle.coOwners)
    });

    // Define database save operation for new vehicle object.
    return await newVehicle.save();
  });

  // Save all defined new Vehicle objects in database.
  await Promise.all(promiseArray);

  // We need to update User table too and add the vehicle
  // id in owner and co-owner specific vehicles arrays.

  // Get all vehicles from db.
  const vehicles = await vehiclesInDb();

  // Init aux mapping array.
  let vehiclesMappedToUser = [];

  // Process first all vehicle owners.
  vehicles.forEach(vehicle => {
    let indexOfFoundOwner = -1;
    if (vehiclesMappedToUser.length > 0) {
      indexOfFoundOwner = vehiclesMappedToUser.findIndex(item =>
        (item.user).toString() === (vehicle.owner).toString()
      );
    }
    if (indexOfFoundOwner < 0) {
      vehiclesMappedToUser.push({ user: vehicle.owner, vehicles: [vehicle.id] });
    } else {
      const foundOwner = vehiclesMappedToUser[indexOfFoundOwner];
      foundOwner.vehicles.push(vehicle.id);
      vehiclesMappedToUser.splice(indexOfFoundOwner, 1, foundOwner);
    }
  });

  // Process then all co-owners.
  vehicles.forEach(vehicle => {
    vehicle.coOwners.forEach(coOwner => {
      let indexOfFoundCoOwner = -1;
      if (vehiclesMappedToUser.length > 0) {
        indexOfFoundCoOwner = vehiclesMappedToUser.findIndex(item =>
          (item.user).toString() === (coOwner).toString()
        );
      }
      if (indexOfFoundCoOwner < 0) {
        vehiclesMappedToUser.push({ user: coOwner, vehicles: [vehicle.id] });
      } else {
        const foundCoOwner = vehiclesMappedToUser[indexOfFoundCoOwner];
        foundCoOwner.vehicles.push(vehicle.id);
        vehiclesMappedToUser.splice(indexOfFoundCoOwner, 1, foundCoOwner);
      }
    });
  });

  // Update mapped users and their vehicles in the database.
  promiseArray = vehiclesMappedToUser.map(async item => {
    return await User.findByIdAndUpdate(item.user, { vehicles: item.vehicles });
  });
  await Promise.all(promiseArray);

  // Finally, we need to set primary vehicle info in each User object.
  promiseArray = initEntries.testUsers.map(async (user) => {
    return await User.findByIdAndUpdate(getUserId(user.username), {
      primaryVehicle: getVehicleId(user.primaryVehicle)
    });
  });
  await Promise.all(promiseArray);
};

const addInitialRefuelingsInDb = async () => {

  // Init vehicles and users first because we need to have
  // vehicle and user ids for refueling entry to be added.
  await addInitialVehiclesInDb();
  const users = await usersInDb();
  const vehicles = await vehiclesInDb();

  // Aux function to get user id.
  const getUserId = (usernameOfUser) => {
    const user = users.find(u => u.username === usernameOfUser);
    return user.id;
  };

  // Aux function to get vehicle id.
  const getVehicleId = (nameOfVehicle) => {
    const vehicle = vehicles.find(v => v.name === nameOfVehicle);
    return vehicle.id;
  };

  // Aux function to get vehicle's odoMeter value.
  const getVehicleOdoMeter = (nameOfVehicle) => {
    const vehicle = vehicles.find(v => v.name === nameOfVehicle);
    return vehicle.odoMeter;
  };

  // Add init refuelings in database based on definition in InitEntries.
  let promiseArray = initEntries.testRefuelings.map(async (refueling) => {

    // Define new Refueling object.
    const newRefueling = new Refueling({
      date: refueling.date,
      odoMeter: refueling.odoMeter,
      liters: refueling.liters,
      tripKilometers: refueling.odoMeter - getVehicleOdoMeter(refueling.vehicle),
      avgConsumption: (refueling.liters / (refueling.odoMeter - getVehicleOdoMeter(refueling.vehicle))) * 100,
      vehicle: getVehicleId(refueling.vehicle),
      user: getUserId(refueling.user)
    });

    // Define database save operation for new Refueling object.
    return await newRefueling.save();
  });

  // Save all defined new Refueling objects in database.
  await Promise.all(promiseArray);

  // Next, we need to add created refueling ids and
  // updated odoMeter values in all related vehicles.

  // Get all added refuelings (including ids) from database.
  const refuelings = await refuelingsInDb();

  // Sort refueling entries by date in ascending order so that
  // vehicle odoMeter value is updated correctly.
  refuelings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Init aux mapping array.
  let refuelingsMappedToVehicle = [];

  // Process all refueling entries.
  refuelings.forEach(refueling => {
    let indexOfFoundVehicle = -1;
    if (refuelingsMappedToVehicle.length > 0) {
      indexOfFoundVehicle = refuelingsMappedToVehicle.findIndex(item =>
        (item.vehicle).toString() === (refueling.vehicle).toString()
      );
    }
    if (indexOfFoundVehicle < 0) {
      refuelingsMappedToVehicle.push({
        vehicle: refueling.vehicle,
        refuelings: [refueling.id],
        odoMeter: refueling.odoMeter
      });
    } else {
      const foundVehicle = refuelingsMappedToVehicle[indexOfFoundVehicle];
      foundVehicle.refuelings.push(refueling.id);
      foundVehicle.odoMeter = refueling.odoMeter;
      refuelingsMappedToVehicle.splice(indexOfFoundVehicle, 1, foundVehicle);
    }
  });

  // Update mapped vehicles including added refueling entries and
  // updated odoMeter values in database.
  promiseArray = refuelingsMappedToVehicle.map(async item => {
    return await Vehicle.findByIdAndUpdate(item.vehicle, {
      refuelings: item.refuelings,
      odoMeter: item.odoMeter
    });
  });
  await Promise.all(promiseArray);
};

const nonExistingUserId = async () => {

  const passwordHash = await bcrypt.hash('willremovethissoon', 10);

  const user = new User({
    name: 'willremovethissoon',
    username: 'willremovethissoon',
    passwordHash
  });

  await user.save();
  await user.remove();

  return user._id.toString();
};

const nonExistingVehicleId = async () => {

  const userId = await nonExistingUserId();

  const vehicle = new Vehicle({
    name: 'willremovethissoon',
    licensePlateId: 'willremovethissoon',
    odoMeter: 0,
    owner: userId
  });

  await vehicle.save();
  await vehicle.remove();

  return vehicle._id.toString();
};

const nonExistingRefuelingId = async () => {

  const userId = await nonExistingUserId();
  const vehicleId = await nonExistingVehicleId();

  const refueling = new Refueling({
    date: new Date(),
    odoMeter: 0,
    liters: 0,
    vehicle: vehicleId,
    user: userId
  });

  await refueling.save();
  await refueling.remove();

  return refueling._id.toString();
};

const usersInDb = async () => {
  const users = await User.find({});
  return users.map(user => user.toJSON());
};

const vehiclesInDb = async () => {
  const vehicles = await Vehicle.find({});
  return vehicles.map(vehicle => vehicle.toJSON());
};

const refuelingsInDb = async () => {
  const refuelings = await Refueling.find({});
  return refuelings.map(refueling => refueling.toJSON());
};

// Executes login with given user and returns token, user id and user name.
// Arguments:
// - UserObject = { user: { username: 'username', password: 'password' } }
const loginUser = async (userObject) => {
  const response = await api
    .post('/api/login')
    .send(userObject);

  return response.body; // { token, id, name }
};

const decodeUserToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const getValidToken = async () => {
  const allTestUsers = initEntries.testUsers;
  const testUser = allTestUsers[0];

  const res = await loginUser({
    user: {
      username: testUser.username,
      password: testUser.password
    }
  });

  return res.token;
};

module.exports = {
  addInitialUsersInDb,
  addInitialVehiclesInDb,
  addInitialRefuelingsInDb,
  nonExistingUserId,
  nonExistingVehicleId,
  nonExistingRefuelingId,
  usersInDb,
  vehiclesInDb,
  refuelingsInDb,
  loginUser,
  decodeUserToken,
  getValidToken
};