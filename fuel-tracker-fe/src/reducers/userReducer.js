import userService from '../services/users';
import vehicleService from '../services/vehicles';
import refuelingService from '../services/refuelings';
import { logoutUser } from './loginReducer';
import { setNotification, clearAllEarlierTimeouts } from './notificationReducer';
import { addInListStates, updateListState, removeFromListStates } from './listStateReducer';

const userReducer = (state = {}, action) => {

  switch(action.type) {

    case 'INIT_USER':
      return action.data;

    case 'ADD_VEHICLE_TO_USER': {
      const updatedUser = { ...state };

      updatedUser.vehicles.push(action.data.vehicle);

      updatedUser.primaryVehicle = action.data.primary;

      return updatedUser;
    }

    case 'UPDATE_USER_VEHICLE': {
      const updatedUser = { ...state };

      updatedUser.vehicles = state.vehicles.map(vehicle =>
        vehicle.id !== action.data.vehicle.id
          ? vehicle
          : action.data.vehicle
      );

      updatedUser.primaryVehicle = action.data.primary;

      return updatedUser;
    }

    case 'ADD_REFUELING': {
      const updatedUser = { ...state };

      updatedUser.vehicles = state.vehicles.map(vehicle => {
        if (vehicle.id === action.data.entry.vehicle.id) {
          // Vehicle odometer is updated only if the
          // entry is added in the end of the list.
          if (action.data.type === 'addEnd') {
            vehicle.odoMeter = action.data.entry.odoMeter;
          }
          vehicle.refuelings.push(action.data.entry);
        }

        return vehicle;
      });

      return updatedUser;
    }

    case 'REMOVE_VEHICLE_FROM_USER': {
      const updatedUser = { ...state };

      // Find index of vehicle that is wanted to remove
      const indexToBeRemoved = state.vehicles.findIndex(v => v.id === action.data.vehicle.id);

      // Splice vehicle to be removed
      updatedUser.vehicles.splice(indexToBeRemoved, 1);

      updatedUser.primaryVehicle = action.data.primary;

      return updatedUser;
    }

    case 'UPDATE_USER_REFUELING_ENTRY': {
      const updatedUser = { ...state };

      // Find vehicle having refueling entry which need to be updated.
      const updatedVehicle = state.vehicles.find(v =>
        v.id === action.data.updatedEntry.vehicle.id
      );

      // Find correct refueling entry from the vehicle and update it.
      updatedVehicle.refuelings = updatedVehicle.refuelings.map(refueling =>
        refueling.id === action.data.updatedEntry.id
          ? action.data.updatedEntry
          : refueling
      );

      // Update vehicle's odometer if that was updated on the server.
      if (action.data.vehicleOdoUpdated) {
        updatedVehicle.odoMeter = action.data.updatedEntry.odoMeter;
      }

      // Find correct vehicle from user's vehicle list and update it.
      updatedUser.vehicles = updatedUser.vehicles.map(vehicle =>
        vehicle.id === updatedVehicle.id
          ? updatedVehicle
          : vehicle
      );

      return updatedUser;
    }

    case 'REMOVE_REFUELING_FROM_USER': {
      const updatedUser = { ...state };

      // Loop through all user's vehicles and find the one having
      // the refueling entry to be removed.
      updatedUser.vehicles = updatedUser.vehicles.map(vehicle => {

        // If vehicle having refueling entry to be removed...
        if (vehicle.id === action.data.removedRefuelingEntry.vehicle) {

          // ...get the index of refueling entry to be removed...
          const indexToBeRemoved = vehicle.refuelings.findIndex(r => r.id === action.data.removedRefuelingEntry.id);

          // ...and then remove the entry referenced by the index.
          vehicle.refuelings.splice(indexToBeRemoved, 1);

          // If the removed refueling entry was the latest one, we need to
          // update vehicles odometer accordingly.
          if (action.data.vehicleOdoUpdated) {
            vehicle.odoMeter = vehicle.odoMeter - action.data.removedRefuelingEntry.tripKilometers;
          }

          // Return updated vehicle record.
          return vehicle;

        } else {
          // Vehicle doesn't have refueling entry to be removed ->
          // return it without any changes.
          return vehicle;
        }
      });

      return updatedUser;
    }

    default:
      return state;
  }
};

// Action creators for userReducer
export const initializeUser = () => {
  return async dispatch => {
    try {
      const user = await userService.getUserById();
      dispatch({
        type: 'INIT_USER',
        data: user
      });
    } catch (error) {
      console.log('userReducer, getUser error:', error);
    }
  };
};

export const addVehicleToUser = (reqObject) => {
  return async dispatch => {
    try {
      const response = await vehicleService.addVehicle(reqObject);

      dispatch({
        type: 'ADD_VEHICLE_TO_USER',
        data: response
      });

      // New vehicle must be added also in Redux storage.
      dispatch(addInListStates({
        id: response.vehicle.id,
        state: response.primary ? 'open' : 'closed'
      }));

      dispatch(setNotification({
        type: 'info',
        header: undefined,
        content: `Ajoneuvo ${response.vehicle.name} (${response.vehicle.licensePlateId}) lisätty onnistuneesti.`,
        timeout: 3.5
      }));

    } catch (error) {

      dispatch(setNotification({
        type: 'error',
        header: undefined,
        content: 'Odottamaton virhe ajoneuvon lisäyksessä. Yritä myöhemmin uudelleen.',
        timeout: 3.5
      }));
    }
  };
};

export const updateUserVehicle = (reqObject) => {
  return async dispatch => {
    try {
      const response = await vehicleService.updateVehicle(reqObject);

      dispatch({
        type: 'UPDATE_USER_VEHICLE',
        data: { vehicle: response.vehicle, primary: response.primary }
      });

      // Primary vehicle status must be saved in Redux store in order
      // open/close the vehicle blocks correctly on Refuelings view.
      dispatch(updateListState({
        id: response.vehicle.id,
        state: response.primary ? 'open' : 'closed'
      }));

      dispatch(setNotification({
        type: 'info',
        header: undefined,
        content: `Ajoneuvo ${response.vehicle.name} (${response.vehicle.licensePlateId}) päivitetty onnistuneesti.`,
        timeout: 3.5
      }));

    } catch (error) {

      dispatch(setNotification({
        type: 'error',
        header: undefined,
        content: 'Odottamaton virhe ajoneuvon päivityksessä. Yritä myöhemmin uudelleen.',
        timeout: 3.5
      }));
    }
  };
};

export const addRefueling = (newRefuelingEntry) => {
  return async dispatch => {
    try {
      const refueling = await refuelingService.addRefueling(newRefuelingEntry);

      dispatch({
        type: 'ADD_REFUELING',
        data: refueling
      });

      dispatch(setNotification({
        type: 'info',
        header: undefined,
        content: 'Uusi tankkaus lisäytty onnistuneesti.',
        timeout: 3.5
      }));

    } catch (error) {

      dispatch(setNotification({
        type: 'error',
        header: undefined,
        content: 'Odottamaton virhe tankkauksen lisäyksessä. Yritä myöhemmin uudelleen.',
        timeout: 3.5
      }));
    }
  };
};

export const removeVehicleFromUser = (vehicleId) => {
  return async dispatch => {
    try {
      const response = await vehicleService.removeVehicle(vehicleId);

      dispatch({
        type: 'REMOVE_VEHICLE_FROM_USER',
        data: response
      });

      dispatch(removeFromListStates(vehicleId));

      dispatch(setNotification({
        type: 'info',
        header: undefined,
        content: `Ajoneuvo ${response.vehicle.name} (${response.vehicle.licensePlateId}) poistettu onnistuneesti.`,
        timeout: 3.5
      }));

    } catch (error) {

      dispatch(setNotification({
        type: 'error',
        header: undefined,
        content: 'Odottamaton virhe ajoneuvon poistossa. Yritä myöhemmin uudelleen.',
        timeout: 3.5
      }));
    }
  };
};

export const updateUserRefuelingEntry = (reqObject) => {
  return async dispatch => {
    try {
      const result = await refuelingService.updateRefueling(reqObject);

      dispatch({
        type: 'UPDATE_USER_REFUELING_ENTRY',
        data: result
      });

      dispatch(setNotification({
        type: 'info',
        header: undefined,
        content: 'Tankkausmerkintä päivitetty onnistuneesti.',
        timeout: 3.5
      }));

    } catch (error) {

      dispatch(setNotification({
        type: 'error',
        header: undefined,
        content: 'Odottamaton virhe tankkausmerkinnän päivityksessä. Yritä myöhemmin uudelleen.',
        timeout: 3.5
      }));
    }
  };
};

export const removeRefuelingFromUser = (RefuelingId) => {
  return async dispatch => {
    try {
      const refueling = await refuelingService.removeRefueling(RefuelingId);

      dispatch({
        type: 'REMOVE_REFUELING_FROM_USER',
        data: refueling
      });

      dispatch(setNotification({
        type: 'info',
        header: undefined,
        content: 'Tankkausmerkintä poistettu onnistuneesti.',
        timeout: 3.5
      }));

    } catch (error) {

      dispatch(setNotification({
        type: 'error',
        header: undefined,
        content: 'Odottamaton virhe tankkausmerkinnän poistossa. Yritä myöhemmin uudelleen.',
        timeout: 3.5
      }));
    }
  };
};

export const removeUserAccount = () => {
  return async dispatch => {
    try {
      await userService.removeUser();

      dispatch(setNotification({
        type: 'info',
        header: undefined,
        content: 'Käyttäjätunnus poistettu onnistuneesti.',
        timeout: 3.5
      }));

      clearAllEarlierTimeouts();

      setTimeout(() => {
        dispatch(logoutUser());
      }, 3500);

    } catch (error) {

      dispatch(setNotification({
        type: 'error',
        header: undefined,
        content: 'Odottamaton virhe käyttäjätunnuksen poistossa. Yritä myöhemmin uudelleen.',
        timeout: 3.5
      }));
    }
  };
};

export default userReducer;