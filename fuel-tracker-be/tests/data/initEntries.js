const testUsers = [
  {
    name: 'Teppo Testaaja',
    username: 'tepsukka',
    password: 'tepsukka123?',
    primaryVehicle: 'Mosse'
  },
  {
    name: 'Simo Säätäjä',
    username: 'säpsäkkä',
    password: 'säpsäkkä123?',
    primaryVehicle: undefined
  },
  {
    name: 'Siiri Siivoaja',
    username: 'sipsakka',
    password: 'sipsakka123?',
    primaryVehicle: 'Lada Niva'
  },
  {
    name: 'Seppo Siivoaja',
    username: 'sepsukka',
    password: 'sepsukka123?',
    primaryVehicle: 'Wartburg'
  },
  {
    name: 'Suvi Siivoaja',
    username: 'supsukka',
    password: 'supsukka123?',
    primaryVehicle: 'Wartburg'
  }
];

const testVehicles = [
  {
    name: 'Mosse',
    licensePlateId: 'MOS-111',
    odoMeter: 1234,
    owner: 'tepsukka',
    coOwners: ['säpsäkkä']
  },
  {
    name: 'Lada Niva',
    licensePlateId: 'LAD-222',
    odoMeter: 45367,
    owner: 'sipsakka',
    coOwners: ['sepsukka']
  },
  {
    name: 'Wartburg',
    licensePlateId: 'WAR-333',
    odoMeter: 134875,
    owner: 'sepsukka',
    coOwners: ['sipsakka', 'supsukka']
  },
  {
    name: 'VW Kupla',
    licensePlateId: 'KUP-444',
    odoMeter: 256448,
    owner: 'tepsukka',
    coOwners: []
  }
];

const testRefuelings = [
  {
    date: '2020-08-30',
    odoMeter: 1742,
    liters: 36.87,
    vehicle: 'Mosse',
    user: 'tepsukka'
  },
  {
    date: '2020-07-01',
    odoMeter: 45994,
    liters: 41.22,
    vehicle: 'Lada Niva',
    user: 'sepsukka'
  },
  {
    date: '2020-05-15',
    odoMeter: 135644,
    liters: 44.61,
    vehicle: 'Wartburg',
    user: 'sepsukka'
  },
  {
    date: '2020-06-02',
    odoMeter: 136011,
    liters: 32.67,
    vehicle: 'Wartburg',
    user: 'sipsakka'
  },
  {
    date: '2020-06-19',
    odoMeter: 136633,
    liters: 39.41,
    vehicle: 'Wartburg',
    user: 'supsukka'
  }
];

module.exports = {
  testUsers,
  testVehicles,
  testRefuelings
};