import userService from '../services/users';

const usersReducer = (state = [], action) => {

  switch(action.type) {

    case 'INIT_USERS_LIST':
      return action.data;

    default:
      return state;
  }
};

// Action creators for usersReducer
export const initSimpleUserList = (id) => {
  return async dispatch => {
    try {
      const users = await userService.getSimpleUserList();
      dispatch({
        type: 'INIT_USERS_LIST',
        data: users
      });
    } catch (error) {
      console.log('usersReducer, getSimpleUserList error:', error);
    }
  };
};

export default usersReducer;