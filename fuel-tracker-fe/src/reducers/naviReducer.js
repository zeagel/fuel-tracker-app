const naviReducer = (state = '', action) => {

  switch(action.type) {

    case 'INIT_ACTIVE_ITEM': {
      const currentPage = window.localStorage.getItem('currentFTAPage');
      if (currentPage) {
        return currentPage;
      }
      return action.data;
    }

    case 'UPDATE_ACTIVE_ITEM': {
      window.localStorage.setItem('currentFTAPage', action.data);
      return action.data;
    }

    default:
      return state;
  }
};

// Action creators
export const initActiveItem = (name) => {
  return dispatch => {
    dispatch({
      type: 'INIT_ACTIVE_ITEM',
      data: name
    });
  };
};

export const setActiveItem = (name) => {
  return dispatch => {
    dispatch({
      type: 'UPDATE_ACTIVE_ITEM',
      data: name
    });
  };
};

export default naviReducer;