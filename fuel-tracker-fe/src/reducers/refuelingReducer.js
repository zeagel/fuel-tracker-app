const refuelingReducer = (state = {}, action) => {

  switch(action.type) {

    case 'SET_REFUELING_ENTRY':
      return action.data;

    case 'RESET_REFUELING_ENTRY':
      return action.data;

    default:
      return state;
  }
};

// Action creators for refuelingReducer
export const setRefuelingEntry = (state) => {
  return dispatch => {
    dispatch({
      type: 'SET_REFUELING_ENTRY',
      data: state
    });
  };
};

export const resetRefuelingEntry = () => {
  return dispatch => {
    dispatch({
      type: 'RESET_REFUELING_ENTRY',
      data: {}
    });
  };
};

export default refuelingReducer;