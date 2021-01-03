// Redux reducer for keeping information which vehicle specific
// refueling block, on Refuelings view, is collapsed and which is expanded.
const listStateReducer = (state = [], action) => {

  switch(action.type) {

    case 'INIT_LIST_STATES':
      return action.data;

    case 'TOGGLE_LIST_STATE': {
      const updatedListStates = state.map(listItem => {
        if (listItem.id === action.data) {
          return { ...listItem, state: listItem.state === 'open' ? 'closed' : 'open' };
        } else {
          return listItem;
        }
      });

      return updatedListStates;
    }

    case 'UPDATE_LIST_STATE': {
      const updatedListStates = state.map(listItem => {
        if (listItem.id === action.data.id) {
          return action.data;
        } else {
          return listItem;
        }
      });

      return updatedListStates;
    }

    case 'REMOVE_FROM_LIST_STATES': {
      const updatedListStates = state.filter(listItem => {
        if (listItem.id !== action.data) {
          return listItem;
        }
        return null;
      });

      return updatedListStates;
    }

    case 'ADD_IN_LIST_STATES': {
      const updatedListStates = [...state];
      updatedListStates.push(action.data);

      return updatedListStates;
    }

    default:
      return state;
  }
};

// Action creators for listStateReducer
export const initListStates = (listStates) => {
  return dispatch => {
    dispatch({
      type: 'INIT_LIST_STATES',
      data: listStates
    });
  };
};

export const toggleListState = (listId) => {
  return dispatch => {
    dispatch({
      type: 'TOGGLE_LIST_STATE',
      data: listId
    });
  };
};

export const updateListState = (listObject) => {
  return dispatch => {
    dispatch({
      type: 'UPDATE_LIST_STATE',
      data: listObject
    });
  };
};

export const removeFromListStates = (id) => {
  return dispatch => {
    dispatch({
      type: 'REMOVE_FROM_LIST_STATES',
      data: id
    });
  };
};

export const addInListStates = (listItemObject) => {
  return dispatch => {
    dispatch({
      type: 'ADD_IN_LIST_STATES',
      data: listItemObject
    });
  };
};

export default listStateReducer;